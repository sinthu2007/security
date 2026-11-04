import { ISecurityFinding, IScanSummary, SecurityGrade, IAiSecurityAnalysis } from '../../types';

export class AiAdvisor {
  /**
   * Generates AI-assisted security analysis, executive summary, and actionable remediation roadmap
   */
  public static generateAnalysis(
    targetUrl: string,
    domain: string,
    score: number,
    grade: SecurityGrade,
    summary: IScanSummary,
    findings: ISecurityFinding[]
  ): IAiSecurityAnalysis {
    // Collect non-informational issues
    const actionItems: string[] = [];
    const criticalAndHigh = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
    const medium = findings.filter(f => f.severity === 'MEDIUM');
    const low = findings.filter(f => f.severity === 'LOW');

    // Priority 1: Critical and High findings
    for (const item of criticalAndHigh) {
      actionItems.push(`[${item.severity}] ${item.name}: ${item.recommendation}`);
    }

    // Priority 2: Medium findings
    for (const item of medium) {
      if (actionItems.length < 5) {
        actionItems.push(`[MEDIUM] ${item.name}: ${item.recommendation}`);
      }
    }

    // Priority 3: Low findings if room
    for (const item of low) {
      if (actionItems.length < 5) {
        actionItems.push(`[LOW] ${item.name}: ${item.recommendation}`);
      }
    }

    if (actionItems.length === 0) {
      actionItems.push('Maintain active monitoring: Continue scanning periodically and verify automated certificate renewal.');
      actionItems.push('Implement defence-in-depth: Ensure backend APIs employ granular rate limiting and parameterized queries.');
      actionItems.push('Review third-party scripts: Audit all external CDN and analytics scripts loaded by the application.');
    }

    // Formulate Executive Summary
    let executiveSummary = '';
    if (grade === 'A+' || grade === 'A') {
      executiveSummary = `Automated security assessment for ${domain} indicates an exemplary defensive security posture (Score: ${score}/100, Grade: ${grade}). The server enforces robust transport-layer encryption, critical security headers, and domain authentication records. No critical vulnerabilities or exploitable transport weaknesses were identified during non-invasive testing.`;
    } else if (grade === 'B') {
      executiveSummary = `Assessment of ${domain} reveals a satisfactory security baseline (Score: ${score}/100, Grade: ${grade}). Key cryptographic configurations are active; however, several foundational security headers or DNS defenses are missing, which could increase susceptibility to client-side framing, XSS, or email spoofing.`;
    } else if (grade === 'C') {
      executiveSummary = `Assessment of ${domain} indicates moderate security risks (Score: ${score}/100, Grade: ${grade}). The evaluation identified ${summary.high + summary.medium} high or medium-priority weaknesses, including missing baseline security policies (such as CSP or HSTS) or insecure cookies. Immediate hardening is recommended.`;
    } else {
      executiveSummary = `CRITICAL ALERT: Target application ${domain} exhibits significant security deficiencies (Score: ${score}/100, Grade: ${grade}). Non-invasive probes detected ${summary.critical} critical and ${summary.high} high-severity findings, including potential transport downgrade vulnerabilities, expired/invalid certificates, or exposed plain HTTP traffic. High priority remediation is required.`;
    }

    // Formulate Posture Assessment
    const postureDetails: string[] = [];
    const sslIssues = findings.filter(f => f.category === 'SSL_TLS' && f.severity !== 'INFORMATIONAL');
    if (sslIssues.length === 0) {
      postureDetails.push('Transport Layer: Modern TLS encryption is properly maintained without certificate errors.');
    } else {
      postureDetails.push(`Transport Layer: ${sslIssues.length} issue(s) detected affecting HTTPS certificate or cipher strength.`);
    }

    const headerIssues = findings.filter(f => f.category === 'SECURITY_HEADERS' && f.severity !== 'INFORMATIONAL');
    if (headerIssues.length === 0) {
      postureDetails.push('HTTP Defense: Security headers (CSP, HSTS, X-Frame-Options) conform to modern web standards.');
    } else {
      postureDetails.push(`HTTP Defense: Missing defensive headers (CSP, HSTS, or anti-clickjacking) leave users exposed to client-side vectors.`);
    }

    const dnsIssues = findings.filter(f => f.category === 'DNS_SECURITY' && f.severity !== 'INFORMATIONAL');
    if (dnsIssues.length === 0) {
      postureDetails.push('Domain & Email Hygiene: SPF and DMARC policies are configured, reducing email spoofing risks.');
    } else {
      postureDetails.push(`Domain & Email Hygiene: Incomplete SPF/DMARC records leave the domain vulnerable to brand impersonation and spoofing.`);
    }

    const postureAssessment = postureDetails.join(' ');

    const complianceNotes = 
      'This non-invasive safe assessment evaluates external security configurations against OWASP Top 10 client-side controls and RFC standards. It does not perform invasive payload injection, credential stuffing, or binary analysis, and should be coupled with regular internal code audits and authenticated penetration testing.';

    return {
      executiveSummary,
      postureAssessment,
      topPriorityActions: actionItems,
      complianceNotes,
    };
  }
}
