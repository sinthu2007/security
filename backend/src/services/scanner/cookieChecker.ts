import { ISecurityFinding } from '../../types';

export interface CookieCheckResult {
  totalCookies: number;
  findings: ISecurityFinding[];
}

export class CookieChecker {
  public static analyze(setCookieHeader: string | string[] | undefined, isHttps: boolean): CookieCheckResult {
    const findings: ISecurityFinding[] = [];

    if (!setCookieHeader) {
      return { totalCookies: 0, findings };
    }

    const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

    for (const cookieStr of cookies) {
      const parts = cookieStr.split(';').map(p => p.trim());
      const nameVal = parts[0] || '';
      const cookieName = nameVal.split('=')[0] || 'Unknown';
      
      const lowerParts = parts.map(p => p.toLowerCase());
      const hasSecure = lowerParts.includes('secure');
      const hasHttpOnly = lowerParts.includes('httponly');
      const sameSitePart = lowerParts.find(p => p.startsWith('samesite='));
      const sameSiteVal = sameSitePart ? sameSitePart.split('=')[1] : null;

      // Check Secure flag
      if (isHttps && !hasSecure) {
        findings.push({
          id: `cookie-missing-secure-${cookieName}`,
          name: `Cookie '${cookieName}' Missing 'Secure' Attribute`,
          category: 'COOKIE_SECURITY',
          severity: 'MEDIUM',
          evidence: `Set-Cookie: ${cookieStr.substring(0, 120)}...`,
          observedValue: 'Secure flag absent',
          expectedValue: 'Secure attribute included in Set-Cookie header',
          description: `The cookie '${cookieName}' lacks the 'Secure' directive. Browsers will transmit this cookie over unencrypted HTTP connections if any insecure request is initiated.`,
          recommendation: `Add the 'Secure' flag to the Set-Cookie directive for '${cookieName}'.`,
          remediationSnippet: `Set-Cookie: ${cookieName}=<value>; Secure; HttpOnly; SameSite=Lax`,
          references: ['https://owasp.org/www-community/controls/SecureCookieAttribute'],
          status: 'CONFIRMED',
        });
      }

      // Check HttpOnly flag
      if (!hasHttpOnly) {
        // Many session/auth cookies need HttpOnly. If name implies session (token, session, auth, sid, jwt)
        const isSessionCookie = /(token|session|auth|sid|jwt|connect\.sid|phpsessid|jsessionid)/i.test(cookieName);
        findings.push({
          id: `cookie-missing-httponly-${cookieName}`,
          name: `Cookie '${cookieName}' Missing 'HttpOnly' Attribute`,
          category: 'COOKIE_SECURITY',
          severity: isSessionCookie ? 'HIGH' : 'LOW',
          evidence: `Set-Cookie: ${cookieStr.substring(0, 120)}...`,
          observedValue: 'HttpOnly flag absent',
          expectedValue: 'HttpOnly attribute present',
          description: `Without HttpOnly, client-side JavaScript (e.g. document.cookie) can read '${cookieName}'. In the event of an XSS vulnerability, an attacker can extract authentication credentials.`,
          recommendation: `Set the HttpOnly flag on cookie '${cookieName}'.`,
          remediationSnippet: `Set-Cookie: ${cookieName}=<value>; HttpOnly; Secure; SameSite=Lax`,
          references: ['https://owasp.org/www-community/HttpOnly'],
          status: 'CONFIRMED',
        });
      }

      // Check SameSite attribute
      if (!sameSiteVal) {
        findings.push({
          id: `cookie-missing-samesite-${cookieName}`,
          name: `Cookie '${cookieName}' Missing 'SameSite' Attribute`,
          category: 'COOKIE_SECURITY',
          severity: 'LOW',
          evidence: `Set-Cookie: ${cookieStr.substring(0, 120)}...`,
          observedValue: 'SameSite attribute not specified',
          expectedValue: 'SameSite=Lax or SameSite=Strict',
          description: `SameSite prevents the browser from sending '${cookieName}' in cross-site requests, mitigating Cross-Site Request Forgery (CSRF).`,
          recommendation: `Explicitly set SameSite=Lax or SameSite=Strict on cookie '${cookieName}'.`,
          remediationSnippet: `Set-Cookie: ${cookieName}=<value>; SameSite=Lax; Secure; HttpOnly`,
          references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite'],
          status: 'POTENTIAL_WEAKNESS',
        });
      } else if (sameSiteVal === 'none' && !hasSecure) {
        findings.push({
          id: `cookie-samesite-none-insecure-${cookieName}`,
          name: `Cookie '${cookieName}' Has SameSite=None Without Secure`,
          category: 'COOKIE_SECURITY',
          severity: 'HIGH',
          evidence: `Set-Cookie: ${cookieStr.substring(0, 120)}...`,
          observedValue: 'SameSite=None without Secure flag',
          expectedValue: 'SameSite=None must be accompanied by Secure',
          description: 'Modern browsers will reject cookies configured with SameSite=None unless the Secure flag is also specified.',
          recommendation: `Add the Secure flag when SameSite=None is used for '${cookieName}'.`,
          references: ['https://web.dev/samesite-cookies-explained/'],
          status: 'CONFIRMED',
        });
      }
    }

    if (cookies.length > 0 && findings.length === 0) {
      findings.push({
        id: 'cookie-flags-verified',
        name: 'Cookie Security Attributes Verified',
        category: 'COOKIE_SECURITY',
        severity: 'INFORMATIONAL',
        evidence: `Analyzed ${cookies.length} cookie(s). All have Secure, HttpOnly, and SameSite configured.`,
        observedValue: 'Proper flags present',
        expectedValue: 'Secure, HttpOnly, and SameSite attributes',
        description: 'Cookies emitted by the server adhere to standard security attributes protecting against credential theft and CSRF.',
        recommendation: 'Maintain strict cookie attribute standards across all API and session endpoints.',
        references: ['https://owasp.org/www-community/controls/SecureCookieAttribute'],
        status: 'INFORMATIONAL',
      });
    }

    return {
      totalCookies: cookies.length,
      findings,
    };
  }
}
