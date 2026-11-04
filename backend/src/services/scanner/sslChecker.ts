import tls from 'tls';
import { ISecurityFinding } from '../../types';
import { logger } from '../../utils/logger';

export interface SslCheckResult {
  supported: boolean;
  tlsVersion?: string;
  cipher?: string;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysUntilExpiry?: number;
  isExpired?: boolean;
  isSelfSigned?: boolean;
  findings: ISecurityFinding[];
}

export class SslChecker {
  public static async analyze(hostname: string, port: number = 443, timeoutMs: number = 8000): Promise<SslCheckResult> {
    const findings: ISecurityFinding[] = [];

    return new Promise((resolve) => {
      let resolved = false;

      const finish = (result: SslCheckResult) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      const socket = tls.connect(
        {
          host: hostname,
          port,
          servername: hostname, // SNI support
          rejectUnauthorized: false, // We inspect cert details even if untrusted
          timeout: timeoutMs,
        },
        () => {
          try {
            const cert = socket.getPeerCertificate(true);
            const protocol = socket.getProtocol() || 'Unknown';
            const cipher = socket.getCipher()?.name || 'Unknown';

            if (!cert || Object.keys(cert).length === 0) {
              findings.push({
                id: 'ssl-no-cert',
                name: 'Missing SSL/TLS Certificate',
                category: 'SSL_TLS',
                severity: 'CRITICAL',
                evidence: 'No peer certificate returned during TLS handshake.',
                observedValue: 'No certificate available',
                expectedValue: 'Valid X.509 Certificate issued by a trusted CA',
                description: 'The server accepts TLS connections but failed to present a valid peer certificate.',
                recommendation: 'Configure a valid X.509 SSL/TLS certificate issued by a recognized certificate authority (e.g. Let\'s Encrypt).',
                references: ['https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html'],
                status: 'CONFIRMED',
              });

              socket.end();
              return finish({ supported: true, findings });
            }

            const issuer = typeof cert.issuer === 'object' ? `${cert.issuer.O || cert.issuer.CN || 'Unknown'}` : String(cert.issuer || '');
            const subject = typeof cert.subject === 'object' ? `${cert.subject.CN || 'Unknown'}` : String(cert.subject || '');
            const validFrom = cert.valid_from;
            const validTo = cert.valid_to;

            const expiryDate = new Date(validTo);
            const now = new Date();
            const timeDiff = expiryDate.getTime() - now.getTime();
            const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
            const isExpired = daysUntilExpiry <= 0;

            // Check self-signed
            const isSelfSigned = cert.issuer && cert.subject && cert.issuer.CN === cert.subject.CN && (!cert.issuer.O || cert.issuer.O === cert.subject.O);

            // Finding 1: Expired certificate
            if (isExpired) {
              findings.push({
                id: 'ssl-cert-expired',
                name: 'SSL/TLS Certificate Has Expired',
                category: 'SSL_TLS',
                severity: 'HIGH',
                evidence: `Certificate expired on ${validTo} (${Math.abs(daysUntilExpiry)} days ago)`,
                observedValue: `Expired on ${validTo}`,
                expectedValue: 'Active valid certificate with future expiration date',
                description: 'Web browsers will present severe security warnings and block regular users from accessing your application.',
                recommendation: 'Renew the SSL/TLS certificate immediately using automated tools like Certbot or your hosting provider.',
                references: ['https://cwe.mitre.org/data/definitions/298.html'],
                status: 'CONFIRMED',
              });
            } else if (daysUntilExpiry <= 30) {
              findings.push({
                id: 'ssl-cert-expiring-soon',
                name: 'SSL/TLS Certificate Expiring Soon',
                category: 'SSL_TLS',
                severity: 'MEDIUM',
                evidence: `Certificate expires in ${daysUntilExpiry} days on ${validTo}`,
                observedValue: `${daysUntilExpiry} days remaining`,
                expectedValue: 'Certificate valid for more than 30 days',
                description: 'Certificate is approaching its expiration date. If not renewed promptly, traffic will encounter security warnings.',
                recommendation: 'Ensure automated certificate renewal (ACME / Let\'s Encrypt) is operating correctly.',
                references: ['https://cwe.mitre.org/data/definitions/298.html'],
                status: 'POTENTIAL_WEAKNESS',
              });
            }

            // Finding 2: Self-signed certificate
            if (isSelfSigned) {
              findings.push({
                id: 'ssl-self-signed',
                name: 'Self-Signed SSL/TLS Certificate Detected',
                category: 'SSL_TLS',
                severity: 'HIGH',
                evidence: `Issuer and Subject both match: ${subject}`,
                observedValue: `Self-signed by ${issuer}`,
                expectedValue: 'Certificate signed by a recognized Public Certificate Authority',
                description: 'Self-signed certificates cannot be validated by client browsers, leaving users susceptible to adversary-in-the-middle (AiTM) attacks.',
                recommendation: 'Replace self-signed certificates with certificates from a publicly trusted CA (e.g. Let\'s Encrypt, Cloudflare).',
                references: ['https://cwe.mitre.org/data/definitions/295.html'],
                status: 'CONFIRMED',
              });
            }

            // Finding 3: Insecure TLS version
            if (protocol === 'TLSv1' || protocol === 'TLSv1.1' || protocol.startsWith('SSL')) {
              findings.push({
                id: 'ssl-insecure-tls-version',
                name: 'Outdated & Deprecated TLS Protocol In Use',
                category: 'SSL_TLS',
                severity: 'HIGH',
                evidence: `Negotiated protocol: ${protocol}`,
                observedValue: protocol,
                expectedValue: 'TLSv1.2 or TLSv1.3',
                description: 'TLS 1.0 and TLS 1.1 have known cryptographic weaknesses (POODLE, BEAST) and are deprecated by RFC 8996 and major web browsers.',
                recommendation: 'Disable TLSv1.0 and TLSv1.1 in your web server configuration (Nginx / Apache / CDN) and enable only TLSv1.2 and TLSv1.3.',
                references: ['https://datatracker.ietf.org/doc/rfc8996/'],
                status: 'CONFIRMED',
              });
            } else if (protocol === 'TLSv1.2' || protocol === 'TLSv1.3') {
              findings.push({
                id: 'ssl-modern-tls-verified',
                name: 'Modern TLS Protocol Enabled',
                category: 'SSL_TLS',
                severity: 'INFORMATIONAL',
                evidence: `Protocol: ${protocol}, Cipher: ${cipher}`,
                observedValue: `${protocol} (${cipher})`,
                expectedValue: 'TLSv1.2 or TLSv1.3',
                description: 'The target server negotiates strong, modern transport layer encryption.',
                recommendation: 'Continue enforcing TLSv1.2 and TLSv1.3 cipher suites.',
                references: ['https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html'],
                status: 'INFORMATIONAL',
              });
            }

            socket.end();
            finish({
              supported: true,
              tlsVersion: protocol,
              cipher,
              issuer,
              subject,
              validFrom,
              validTo,
              daysUntilExpiry,
              isExpired,
              isSelfSigned,
              findings,
            });
          } catch (err: any) {
            socket.destroy();
            finish({
              supported: false,
              findings: [
                {
                  id: 'ssl-inspection-error',
                  name: 'SSL/TLS Certificate Inspection Issue',
                  category: 'SSL_TLS',
                  severity: 'LOW',
                  evidence: err.message,
                  observedValue: 'Inspection failed',
                  expectedValue: 'Successful handshake and certificate extraction',
                  description: 'Unable to parse certificate details during connection.',
                  recommendation: 'Verify TLS configuration and certificate installation on target web server.',
                  references: [],
                  status: 'INCONCLUSIVE',
                },
              ],
            });
          }
        }
      );

      socket.on('timeout', () => {
        socket.destroy();
        finish({
          supported: false,
          findings: [
            {
              id: 'ssl-handshake-timeout',
              name: 'TLS Handshake Timeout on Port 443',
              category: 'SSL_TLS',
              severity: 'HIGH',
              evidence: `Connection timed out after ${timeoutMs}ms`,
              observedValue: 'Timeout',
              expectedValue: 'Responsive TLS handshake within 5000ms',
              description: 'The server did not respond to TLS connection requests on port 443.',
              recommendation: 'Check firewall rules and web server HTTPS binding on port 443.',
              references: [],
              status: 'CONFIRMED',
            },
          ],
        });
      });

      socket.on('error', (err: any) => {
        socket.destroy();
        findings.push({
          id: 'ssl-connection-failed',
          name: 'HTTPS/TLS Connection Failed',
          category: 'SSL_TLS',
          severity: 'HIGH',
          evidence: `Socket error: ${err.message}`,
          observedValue: 'Connection refused / TLS failed',
          expectedValue: 'Standard TLS listener on port 443',
          description: 'The server does not support secure HTTPS communication or refused the connection.',
          recommendation: 'Install an SSL certificate and configure HTTPS redirection.',
          references: ['https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html'],
          status: 'CONFIRMED',
        });

        finish({
          supported: false,
          findings,
        });
      });
    });
  }
}
