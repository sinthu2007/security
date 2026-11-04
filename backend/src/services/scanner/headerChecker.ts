import http from 'http';
import https from 'https';
import { URL } from 'url';
import { ISecurityFinding } from '../../types';
import { SsrfValidator } from './ssrfValidator';
import { logger } from '../../utils/logger';

export interface HeaderCheckResult {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  serverHeader?: string;
  poweredByHeader?: string;
  httpsRedirectSupported: boolean;
  findings: ISecurityFinding[];
}

export class HeaderChecker {
  public static async analyze(targetUrl: string, timeoutMs: number = 10000): Promise<HeaderCheckResult> {
    const findings: ISecurityFinding[] = [];

    // Step 1: Check HTTP -> HTTPS redirect
    const parsed = new URL(targetUrl);
    const domain = parsed.hostname;
    const httpsRedirectResult = await this.checkHttpToHttpsRedirect(domain, timeoutMs);

    if (!httpsRedirectResult.redirectsToHttps) {
      findings.push({
        id: 'hdr-no-https-redirect',
        name: 'Insecure Plain HTTP Traffic Permitted (No HTTPS Redirect)',
        category: 'SECURITY_HEADERS',
        severity: 'HIGH',
        evidence: `HTTP port 80 response code: ${httpsRedirectResult.statusCode || 'None'}, Location: ${httpsRedirectResult.location || 'None'}`,
        observedValue: httpsRedirectResult.location ? `Redirects to ${httpsRedirectResult.location}` : 'No redirect to HTTPS',
        expectedValue: 'HTTP 301 Permanent Redirect to https://' + domain,
        description: 'Unencrypted plain HTTP communication is accessible without automatic upgrade to HTTPS. Users and credentials may be intercepted in transit.',
        recommendation: 'Configure your web server to immediately redirect all plain HTTP requests to HTTPS with a 301 Permanent Redirect status code.',
        remediationSnippet: 'server {\n    listen 80;\n    server_name example.com;\n    return 301 https://$host$request_uri;\n}',
        references: ['https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html'],
        status: 'CONFIRMED',
      });
    }

    // Step 2: Request the primary target URL (preferred HTTPS)
    const normalizedUrl = targetUrl.startsWith('http://') && httpsRedirectResult.redirectsToHttps
      ? targetUrl.replace('http://', 'https://')
      : targetUrl;

    const response = await this.fetchHeaders(normalizedUrl, timeoutMs);
    const headers = response.headers;
    const serverHeader = (headers['server'] as string) || '';
    const poweredByHeader = (headers['x-powered-by'] as string) || '';

    // Check 1: Content-Security-Policy (CSP)
    const csp = headers['content-security-policy'] as string;
    if (!csp) {
      findings.push({
        id: 'hdr-missing-csp',
        name: 'Missing Content-Security-Policy (CSP) Header',
        category: 'SECURITY_HEADERS',
        severity: 'MEDIUM',
        evidence: 'Content-Security-Policy header is absent from HTTP response.',
        observedValue: 'Header not set',
        expectedValue: 'Content-Security-Policy: default-src \'self\'; ...',
        description: 'Content Security Policy (CSP) provides a critical defense layer against Cross-Site Scripting (XSS), data injection, and malicious frame injection.',
        recommendation: 'Define and enforce a strict CSP policy restricting valid sources for scripts, styles, frames, and images.',
        remediationSnippet: 'Content-Security-Policy: default-src \'self\'; script-src \'self\'; object-src \'none\'; upgrade-insecure-requests;',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP', 'https://owasp.org/www-project-secure-headers/#content-security-policy'],
        status: 'CONFIRMED',
      });
    } else {
      if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
        findings.push({
          id: 'hdr-weak-csp',
          name: 'Content-Security-Policy Contains Unsafe Directives',
          category: 'SECURITY_HEADERS',
          severity: 'LOW',
          evidence: `CSP Value: ${csp.substring(0, 150)}...`,
          observedValue: "Contains 'unsafe-inline' or 'unsafe-eval'",
          expectedValue: 'Strict CSP using cryptographic nonces or hashes instead of unsafe directives',
          description: 'Allowing unsafe-inline or unsafe-eval weakens the protection provided by CSP against XSS attacks.',
          recommendation: 'Refactor inline scripts to external scripts and use cryptographic nonces or SHA hashes.',
          references: ['https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html'],
          status: 'POTENTIAL_WEAKNESS',
        });
      } else {
        findings.push({
          id: 'hdr-valid-csp',
          name: 'Content-Security-Policy Header Enforced',
          category: 'SECURITY_HEADERS',
          severity: 'INFORMATIONAL',
          evidence: `CSP directives configured: ${csp.substring(0, 100)}...`,
          observedValue: csp.substring(0, 100),
          expectedValue: 'Valid Content-Security-Policy',
          description: 'Strong CSP defense detected protecting against XSS attacks.',
          recommendation: 'Regularly audit and refine allowed external origin domains.',
          references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'],
          status: 'INFORMATIONAL',
        });
      }
    }

    // Check 2: Strict-Transport-Security (HSTS)
    const hsts = headers['strict-transport-security'] as string;
    if (!hsts) {
      findings.push({
        id: 'hdr-missing-hsts',
        name: 'Missing HTTP Strict-Transport-Security (HSTS) Header',
        category: 'SECURITY_HEADERS',
        severity: 'MEDIUM',
        evidence: 'Strict-Transport-Security header is not present.',
        observedValue: 'Header not set',
        expectedValue: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        description: 'Without HSTS, the browser cannot guarantee that subsequent connections will exclusively use TLS, exposing users to SSL stripping attacks.',
        recommendation: 'Configure HSTS with a max-age of at least 6 months (15724800 seconds) and includeSubDomains.',
        remediationSnippet: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security'],
        status: 'CONFIRMED',
      });
    } else {
      const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      if (maxAge < 10368000) { // less than 120 days
        findings.push({
          id: 'hdr-low-hsts-maxage',
          name: 'HSTS max-age Duration is Low',
          category: 'SECURITY_HEADERS',
          severity: 'LOW',
          evidence: `Observed HSTS: ${hsts}`,
          observedValue: `max-age=${maxAge} seconds`,
          expectedValue: 'max-age=31536000 (1 year)',
          description: 'A low max-age reduces the time window in which the browser enforces secure transport without prior plain-text contact.',
          recommendation: 'Increase HSTS max-age to 31536000 (1 year) and consider submitting to HSTS preload list.',
          references: ['https://hstspreload.org/'],
          status: 'POTENTIAL_WEAKNESS',
        });
      }
    }

    // Check 3: X-Frame-Options
    const xfo = headers['x-frame-options'] as string;
    if (!xfo) {
      findings.push({
        id: 'hdr-missing-xfo',
        name: 'Missing X-Frame-Options Header (Clickjacking Risk)',
        category: 'SECURITY_HEADERS',
        severity: 'MEDIUM',
        evidence: 'X-Frame-Options header is absent.',
        observedValue: 'Header not set',
        expectedValue: 'X-Frame-Options: DENY or SAMEORIGIN',
        description: 'Websites without frame protection can be embedded in an iframe on an attacker site, enabling clickjacking attacks.',
        recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN (or frame-ancestors directive in CSP).',
        remediationSnippet: 'X-Frame-Options: SAMEORIGIN',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options'],
        status: 'CONFIRMED',
      });
    } else {
      const xfoVal = xfo.toUpperCase();
      if (xfoVal !== 'DENY' && xfoVal !== 'SAMEORIGIN') {
        findings.push({
          id: 'hdr-invalid-xfo',
          name: 'Non-Standard X-Frame-Options Configuration',
          category: 'SECURITY_HEADERS',
          severity: 'LOW',
          evidence: `X-Frame-Options: ${xfo}`,
          observedValue: xfo,
          expectedValue: 'DENY or SAMEORIGIN',
          description: 'The specified X-Frame-Options value may not be recognized or supported by modern browsers.',
          recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN.',
          references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options'],
          status: 'POTENTIAL_WEAKNESS',
        });
      }
    }

    // Check 4: X-Content-Type-Options
    const xcto = headers['x-content-type-options'] as string;
    if (!xcto || xcto.toLowerCase() !== 'nosniff') {
      findings.push({
        id: 'hdr-missing-xcto',
        name: 'Missing or Invalid X-Content-Type-Options Header',
        category: 'SECURITY_HEADERS',
        severity: 'LOW',
        evidence: xcto ? `X-Content-Type-Options: ${xcto}` : 'Header not present',
        observedValue: xcto || 'Header not set',
        expectedValue: 'X-Content-Type-Options: nosniff',
        description: 'Without the nosniff directive, legacy browsers may MIME-sniff responses away from the declared Content-Type, leading to drive-by code execution.',
        recommendation: 'Add X-Content-Type-Options: nosniff to all responses.',
        remediationSnippet: 'X-Content-Type-Options: nosniff',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options'],
        status: 'CONFIRMED',
      });
    }

    // Check 5: Referrer-Policy
    const referrerPolicy = headers['referrer-policy'] as string;
    if (!referrerPolicy) {
      findings.push({
        id: 'hdr-missing-referrer-policy',
        name: 'Missing Referrer-Policy Header',
        category: 'SECURITY_HEADERS',
        severity: 'LOW',
        evidence: 'Referrer-Policy header is absent.',
        observedValue: 'Header not set',
        expectedValue: 'Referrer-Policy: strict-origin-when-cross-origin or no-referrer',
        description: 'The Referrer-Policy header controls how much referrer information is sent along with requests, preventing leakage of sensitive URL path or query parameters.',
        recommendation: 'Set Referrer-Policy to strict-origin-when-cross-origin or no-referrer.',
        remediationSnippet: 'Referrer-Policy: strict-origin-when-cross-origin',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy'],
        status: 'POTENTIAL_WEAKNESS',
      });
    }

    // Check 6: Permissions-Policy
    const permissionsPolicy = headers['permissions-policy'] as string;
    if (!permissionsPolicy) {
      findings.push({
        id: 'hdr-missing-permissions-policy',
        name: 'Permissions-Policy Header Not Configured',
        category: 'SECURITY_HEADERS',
        severity: 'INFORMATIONAL',
        evidence: 'Permissions-Policy header is absent.',
        observedValue: 'Header not set',
        expectedValue: 'Permissions-Policy: camera=(), microphone=(), geolocation=()',
        description: 'Permissions-Policy allows developers to explicitly restrict access to sensitive browser hardware and features (e.g. camera, microphone, geolocation).',
        recommendation: 'Define a Permissions-Policy header disabling unused browser capabilities.',
        remediationSnippet: 'Permissions-Policy: camera=(), microphone=(), geolocation=()',
        references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy'],
        status: 'INFORMATIONAL',
      });
    }

    // Check 7: Server Version Information Disclosure
    if (serverHeader) {
      // Check if it reveals version numbers e.g. Apache/2.4.41 or nginx/1.18.0
      if (/\d+\.\d+/.test(serverHeader)) {
        findings.push({
          id: 'info-server-version-disclosure',
          name: 'Web Server Version Disclosed in HTTP Header',
          category: 'INFORMATION_DISCLOSURE',
          severity: 'LOW',
          evidence: `Server: ${serverHeader}`,
          observedValue: serverHeader,
          expectedValue: 'Generic or suppressed Server header (e.g., Server: webserver or omitted)',
          description: 'Detailed software version numbers facilitate targeted reconnaissance by adversaries seeking known CVEs for specific web server versions.',
          recommendation: 'Configure your web server (e.g., server_tokens off in Nginx, ServerSignature Off in Apache) to suppress version details.',
          remediationSnippet: 'nginx.conf:\nserver_tokens off;\n\napache2.conf:\nServerSignature Off\nServerTokens Prod',
          references: ['https://cwe.mitre.org/data/definitions/200.html'],
          status: 'CONFIRMED',
        });
      }
    }

    // Check 8: X-Powered-By Information Disclosure
    if (poweredByHeader) {
      findings.push({
        id: 'info-x-powered-by-disclosure',
        name: 'Backend Technology Disclosed via X-Powered-By Header',
        category: 'INFORMATION_DISCLOSURE',
        severity: 'LOW',
        evidence: `X-Powered-By: ${poweredByHeader}`,
        observedValue: poweredByHeader,
        expectedValue: 'X-Powered-By header removed',
        description: 'Revealing the application framework or runtime (e.g., Express, PHP, ASP.NET) aids attackers in finger-printing the technology stack.',
        recommendation: 'Disable X-Powered-By header in application configuration (e.g., app.disable("x-powered-by") in Express).',
        remediationSnippet: 'express: app.disable("x-powered-by");\nphp: expose_php = Off in php.ini',
        references: ['https://cwe.mitre.org/data/definitions/200.html'],
        status: 'CONFIRMED',
      });
    }

    return {
      statusCode: response.statusCode,
      headers,
      serverHeader,
      poweredByHeader,
      httpsRedirectSupported: httpsRedirectResult.redirectsToHttps,
      findings,
    };
  }

  private static fetchHeaders(targetUrl: string, timeoutMs: number): Promise<{ statusCode: number; headers: Record<string, string | string[] | undefined> }> {
    return new Promise((resolve) => {
      try {
        const parsed = new URL(targetUrl);
        const client = parsed.protocol === 'https:' ? https : http;

        const req = client.request(
          targetUrl,
          {
            method: 'GET',
            timeout: timeoutMs,
            headers: {
              'User-Agent': 'AegisGuard-Security-Assessment/1.0 (+https://aegisguard.security/bot)',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          },
          (res) => {
            const statusCode = res.statusCode || 200;
            const headers = res.headers;
            res.resume(); // Discard response stream to free memory
            resolve({ statusCode, headers });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          resolve({ statusCode: 0, headers: {} });
        });

        req.on('error', () => {
          resolve({ statusCode: 0, headers: {} });
        });

        req.end();
      } catch {
        resolve({ statusCode: 0, headers: {} });
      }
    });
  }

  private static checkHttpToHttpsRedirect(domain: string, timeoutMs: number): Promise<{ redirectsToHttps: boolean; statusCode?: number; location?: string }> {
    return new Promise((resolve) => {
      try {
        const req = http.request(
          `http://${domain}/`,
          {
            method: 'HEAD',
            timeout: timeoutMs,
            headers: {
              'User-Agent': 'AegisGuard-Security-Assessment/1.0',
            },
          },
          (res) => {
            const statusCode = res.statusCode || 0;
            const location = (res.headers['location'] as string) || '';
            const redirectsToHttps = (statusCode === 301 || statusCode === 302 || statusCode === 307 || statusCode === 308) &&
              location.toLowerCase().startsWith('https://');

            resolve({
              redirectsToHttps,
              statusCode,
              location,
            });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          resolve({ redirectsToHttps: false });
        });

        req.on('error', () => {
          resolve({ redirectsToHttps: false });
        });

        req.end();
      } catch {
        resolve({ redirectsToHttps: false });
      }
    });
  }
}
