import dns from 'dns';
import ipaddr from 'ipaddr.js';
import { URL } from 'url';

export interface IssrfValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  hostname?: string;
  protocol?: string;
  port?: number;
  resolvedIp?: string;
  error?: string;
}

export class SsrfValidator {
  private static BLOCKED_METADATA_IPS = [
    '169.254.169.254', // AWS / GCP / Azure metadata
    '169.254.169.253', // AWS DNS
    'fd00:ec2::254',   // AWS IPv6 metadata
  ];

  /**
   * Validates target URL against SSRF attacks and internal/private IP destinations
   */
  public static async validateUrl(inputUrl: string): Promise<IssrfValidationResult> {
    try {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(inputUrl);
      } catch {
        return {
          isValid: false,
          error: 'Invalid URL format. Please provide a full URL with scheme (e.g., https://example.com)',
        };
      }

      // Check scheme
      const protocol = parsedUrl.protocol.toLowerCase();
      if (protocol !== 'http:' && protocol !== 'https:') {
        return {
          isValid: false,
          error: 'Only HTTP and HTTPS protocols are permitted for security assessments.',
        };
      }

      const hostname = parsedUrl.hostname.toLowerCase();

      // Check for localhost / loopback names
      if (
        hostname === 'localhost' ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal')
      ) {
        return {
          isValid: false,
          error: 'SSRF Protection: Access to localhost and internal domain names is strictly prohibited.',
        };
      }

      // Determine default or custom port
      const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : (protocol === 'https:' ? 443 : 80);
      if (port !== 80 && port !== 443 && port !== 8080 && port !== 8443) {
        return {
          isValid: false,
          error: 'Only standard web ports (80, 443, 8080, 8443) are allowed for non-invasive scanning.',
        };
      }

      // Check if hostname is directly an IP address
      if (ipaddr.isValid(hostname)) {
        const ipCheck = this.validateIpAddress(hostname);
        if (!ipCheck.isValid) {
          return {
            isValid: false,
            error: `SSRF Protection: ${ipCheck.error}`,
          };
        }
        return {
          isValid: true,
          normalizedUrl: parsedUrl.toString(),
          hostname,
          protocol,
          port,
          resolvedIp: hostname,
        };
      }

      // Resolve DNS to verify all destination IP addresses
      const lookupResult = await dns.promises.lookup(hostname, { all: true });

      if (!lookupResult || lookupResult.length === 0) {
        return {
          isValid: false,
          error: `DNS resolution failed for hostname: ${hostname}. Domain does not exist or has no DNS records.`,
        };
      }

      // Check each resolved IP address
      for (const entry of lookupResult) {
        const ipCheck = this.validateIpAddress(entry.address);
        if (!ipCheck.isValid) {
          return {
            isValid: false,
            error: `SSRF Protection: Hostname resolves to protected address [${entry.address}]: ${ipCheck.error}`,
          };
        }
      }

      const resolvedIp = lookupResult[0].address;

      return {
        isValid: true,
        normalizedUrl: parsedUrl.toString(),
        hostname,
        protocol,
        port,
        resolvedIp,
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: `URL validation error: ${err.message}`,
      };
    }
  }

  /**
   * Checks whether an IP address is public and safe to connect to
   */
  public static validateIpAddress(ipString: string): { isValid: boolean; error?: string } {
    try {
      if (this.BLOCKED_METADATA_IPS.includes(ipString)) {
        return { isValid: false, error: 'Access to Cloud Provider Metadata endpoints is blocked.' };
      }

      const addr = ipaddr.parse(ipString);
      const range = addr.range();

      // Allowed range: only 'unicast' for IPv4 and IPv6
      const blockedRanges = [
        'loopback',
        'private',
        'linkLocal',
        'carrierGradeNat',
        'broadcast',
        'uniqueLocal',
        'unspecified',
        'reserved',
        'multicast',
      ];

      if (blockedRanges.includes(range)) {
        return {
          isValid: false,
          error: `Address belongs to forbidden range: ${range} (${ipString}).`,
        };
      }

      return { isValid: true };
    } catch (err: any) {
      return { isValid: false, error: `Invalid IP address format: ${err.message}` };
    }
  }
}
