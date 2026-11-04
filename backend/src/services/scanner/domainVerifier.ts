import dns from 'dns';
import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { SsrfValidator } from './ssrfValidator';
import { logger } from '../../utils/logger';

export class DomainVerifier {
  public static generateVerificationToken(): string {
    return `aegis-verify-${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Verifies domain via DNS TXT record
   * Expects TXT record matching "security-verify-platform=<token>" or simply "<token>"
   */
  public static async verifyByDnsTxt(domain: string, expectedToken: string): Promise<{ verified: boolean; message: string }> {
    try {
      // Query both domain and _security-verify.<domain>
      const hostsToQuery = [domain, `_security-verify.${domain}`];
      let found = false;
      let checkedRecords: string[] = [];

      for (const host of hostsToQuery) {
        try {
          const records = await dns.promises.resolveTxt(host);
          // records is an array of arrays of strings: string[][]
          const flatRecords = records.flat();
          checkedRecords = checkedRecords.concat(flatRecords);

          for (const rec of flatRecords) {
            if (rec.includes(expectedToken) || rec === expectedToken) {
              found = true;
              break;
            }
          }
        } catch (e) {
          // host might not have TXT records, continue to next
        }
        if (found) break;
      }

      if (found) {
        return {
          verified: true,
          message: 'DNS TXT verification successful. Domain ownership confirmed.',
        };
      }

      return {
        verified: false,
        message: `TXT verification record not found for domain ${domain}. Checked TXT values: ${checkedRecords.slice(0, 5).join(', ') || 'None found'}. Expected token: ${expectedToken}`,
      };
    } catch (err: any) {
      return {
        verified: false,
        message: `DNS query failed: ${err.message}`,
      };
    }
  }

  /**
   * Verifies domain via HTTP file lookup:
   * http://<domain>/.well-known/security-platform-verify.txt
   */
  public static async verifyByHttpFile(domain: string, expectedToken: string): Promise<{ verified: boolean; message: string }> {
    try {
      const verifyUrl = `http://${domain}/.well-known/security-platform-verify.txt`;
      
      // Perform SSRF validation on the target verification URL
      const ssrfCheck = await SsrfValidator.validateUrl(verifyUrl);
      if (!ssrfCheck.isValid) {
        return {
          verified: false,
          message: `Verification blocked by safety check: ${ssrfCheck.error}`,
        };
      }

      const body = await this.safeHttpGet(verifyUrl, 8000);
      if (body && body.includes(expectedToken)) {
        return {
          verified: true,
          message: 'HTTP verification file confirmed. Domain authorization verified.',
        };
      }

      return {
        verified: false,
        message: `Verification file at ${verifyUrl} does not contain the expected verification token.`,
      };
    } catch (err: any) {
      return {
        verified: false,
        message: `HTTP verification check error: ${err.message}`,
      };
    }
  }

  private static safeHttpGet(targetUrl: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(targetUrl);
      const client = parsed.protocol === 'https:' ? https : http;

      const req = client.get(
        targetUrl,
        {
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'AegisGuard-Security-Verifier/1.0 (+https://aegisguard.security/bot)',
            'Accept': 'text/plain',
          },
        },
        (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            resolve('');
            return;
          }
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk;
            if (data.length > 50000) {
              req.destroy();
              resolve(data);
            }
          });
          res.on('end', () => resolve(data));
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Verification request timed out.'));
      });

      req.on('error', (err) => reject(err));
    });
  }
}
