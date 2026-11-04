import http from 'http';
import https from 'https';
import { URL } from 'url';
import { ISecurityFinding } from '../../types';
import { SsrfValidator } from './ssrfValidator';

export interface ConfigCheckResult {
  hasRobotsTxt: boolean;
  hasSecurityTxt: boolean;
  findings: ISecurityFinding[];
}

export class ConfigChecker {
  public static async analyze(targetUrl: string, timeoutMs: number = 8000): Promise<ConfigCheckResult> {
    const findings: ISecurityFinding[] = [];
    const parsed = new URL(targetUrl);
    const origin = `${parsed.protocol}//${parsed.host}`;

    let hasRobotsTxt = false;
    let hasSecurityTxt = false;

    // 1. Non-invasive check for security.txt (RFC 9116)
    try {
      const secUrl1 = `${origin}/.well-known/security.txt`;
      const secRes1 = await this.safeFetch(secUrl1, timeoutMs);

      if (secRes1.statusCode === 200 && secRes1.body && (secRes1.body.includes('Contact:') || secRes1.body.includes('contact:'))) {
        hasSecurityTxt = true;
        findings.push({
          id: 'meta-security-txt-present',
          name: 'Security Vulnerability Disclosure (security.txt) Published',
          category: 'CONFIGURATION',
          severity: 'INFORMATIONAL',
          evidence: `Located at ${secUrl1}`,
          observedValue: 'Valid RFC 9116 security.txt present',
          expectedValue: 'RFC 9116 security.txt available for vulnerability reporting',
          description: 'The website provides a standard security contact point for ethical security researchers according to RFC 9116.',
          recommendation: 'Ensure your security.txt contact email and PGP keys are kept up to date.',
          references: ['https://www.rfc-editor.org/rfc/rfc9116'],
          status: 'INFORMATIONAL',
        });
      } else {
        findings.push({
          id: 'meta-missing-security-txt',
          name: 'Missing security.txt Vulnerability Disclosure Policy',
          category: 'CONFIGURATION',
          severity: 'INFORMATIONAL',
          evidence: `HTTP ${secRes1.statusCode} at ${secUrl1}`,
          observedValue: 'Not found',
          expectedValue: 'security.txt file at /.well-known/security.txt',
          description: 'Publishing a security.txt file (RFC 9116) gives security researchers a clear, authorized channel to report potential vulnerabilities before public disclosure.',
          recommendation: 'Create a /.well-known/security.txt file containing Contact, Expires, and Preferred-Languages directives.',
          remediationSnippet: 'Contact: mailto:security@example.com\nExpires: 2026-12-31T23:59:59.000Z\nPreferred-Languages: en',
          references: ['https://www.rfc-editor.org/rfc/rfc9116'],
          status: 'INFORMATIONAL',
        });
      }
    } catch {
      // Safe fallback
    }

    // 2. Non-invasive check for robots.txt
    try {
      const robotsUrl = `${origin}/robots.txt`;
      const robotsRes = await this.safeFetch(robotsUrl, timeoutMs);

      if (robotsRes.statusCode === 200 && robotsRes.body) {
        hasRobotsTxt = true;
        const body = robotsRes.body;
        const lines = body.split('\n');
        const sensitiveMatches: string[] = [];

        const sensitiveKeywords = [
          '/admin',
          '/administrator',
          '/backend',
          '/backup',
          '/backups',
          '/config',
          '/.git',
          '/.env',
          '/db',
          '/database',
          '/internal',
          '/private',
          '/wp-admin',
        ];

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith('disallow:')) {
            const path = trimmed.split(':')[1]?.trim() || '';
            for (const kw of sensitiveKeywords) {
              if (path.toLowerCase().startsWith(kw)) {
                sensitiveMatches.push(path);
              }
            }
          }
        }

        if (sensitiveMatches.length > 0) {
          const uniqueSensitive = Array.from(new Set(sensitiveMatches));
          findings.push({
            id: 'meta-robots-sensitive-paths',
            name: 'Sensitive Administrative Paths Exposed in robots.txt',
            category: 'INFORMATION_DISCLOSURE',
            severity: 'LOW',
            evidence: `Disallow paths found: ${uniqueSensitive.slice(0, 5).join(', ')}`,
            observedValue: `${uniqueSensitive.length} sensitive path(s) listed in Disallow directives`,
            expectedValue: 'Do not rely on robots.txt for access control; avoid listing sensitive administrative endpoints',
            description: 'Listing administrative or private directory paths in robots.txt inadvertently announces these locations to malicious bots and attackers.',
            recommendation: 'Enforce proper authentication and authorization at the application layer rather than publicizing endpoints in robots.txt.',
            references: ['https://cwe.mitre.org/data/definitions/200.html'],
            status: 'POTENTIAL_WEAKNESS',
          });
        } else {
          findings.push({
            id: 'meta-robots-txt-verified',
            name: 'robots.txt Inspected and Free of Sensitive Disallow Disclosures',
            category: 'CONFIGURATION',
            severity: 'INFORMATIONAL',
            evidence: `robots.txt is accessible with ${lines.length} lines.`,
            observedValue: 'Standard crawl rules',
            expectedValue: 'Safe crawl guidelines without sensitive path leaks',
            description: 'robots.txt provides standard crawler guidance without publicizing internal administrative paths.',
            recommendation: 'Continue protecting private routes via access control rather than robots.txt.',
            references: ['https://developers.google.com/search/docs/crawling-indexing/robots/intro'],
            status: 'INFORMATIONAL',
          });
        }
      }
    } catch {
      // Safe fallback
    }

    return {
      hasRobotsTxt,
      hasSecurityTxt,
      findings,
    };
  }

  private static safeFetch(targetUrl: string, timeoutMs: number): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(targetUrl);
        const client = parsed.protocol === 'https:' ? https : http;

        const req = client.get(
          targetUrl,
          {
            timeout: timeoutMs,
            headers: {
              'User-Agent': 'AegisGuard-Security-Assessment/1.0 (+https://aegisguard.security/bot)',
              'Accept': 'text/plain,*/*',
            },
          },
          (res) => {
            const statusCode = res.statusCode || 0;
            let body = '';
            res.setEncoding('utf8');

            res.on('data', (chunk) => {
              body += chunk;
              if (body.length > 25000) {
                req.destroy();
                resolve({ statusCode, body });
              }
            });

            res.on('end', () => resolve({ statusCode, body }));
          }
        );

        req.on('timeout', () => {
          req.destroy();
          resolve({ statusCode: 0, body: '' });
        });

        req.on('error', () => {
          resolve({ statusCode: 0, body: '' });
        });
      } catch {
        resolve({ statusCode: 0, body: '' });
      }
    });
  }
}
