import dns from 'dns';
import { ISecurityFinding } from '../../types';
import { logger } from '../../utils/logger';

export interface DnsCheckResult {
  hasSpf: boolean;
  spfRecord?: string;
  hasDmarc: boolean;
  dmarcRecord?: string;
  hasMx: boolean;
  mxRecords?: string[];
  findings: ISecurityFinding[];
}

export class DnsChecker {
  public static async analyze(domain: string): Promise<DnsCheckResult> {
    const findings: ISecurityFinding[] = [];
    let hasSpf = false;
    let spfRecord: string | undefined;
    let hasDmarc = false;
    let dmarcRecord: string | undefined;
    let hasMx = false;
    let mxRecords: string[] = [];

    // 1. Check MX records
    try {
      const mx = await dns.promises.resolveMx(domain);
      if (mx && mx.length > 0) {
        hasMx = true;
        mxRecords = mx.map(m => `${m.exchange} (pri: ${m.priority})`);
      }
    } catch {
      hasMx = false;
    }

    // 2. Check SPF in TXT records
    try {
      const txtRecords = await dns.promises.resolveTxt(domain);
      const flatTxt = txtRecords.flat();
      const spf = flatTxt.find(t => t.toLowerCase().startsWith('v=spf1'));

      if (spf) {
        hasSpf = true;
        spfRecord = spf;

        if (spf.includes('+all')) {
          findings.push({
            id: 'dns-spf-permissive-all',
            name: 'Overly Permissive SPF Record (+all)',
            category: 'DNS_SECURITY',
            severity: 'HIGH',
            evidence: `SPF Record: ${spf}`,
            observedValue: '+all detected',
            expectedValue: 'v=spf1 ... -all (hardfail) or ~all (softfail)',
            description: 'The SPF record contains +all, authorizing any IP address on the internet to send email on behalf of your domain.',
            recommendation: 'Change +all to ~all or -all to restrict unauthorized mail servers from sending spoofed emails.',
            references: ['https://www.rfc-editor.org/rfc/rfc7208'],
            status: 'CONFIRMED',
          });
        } else {
          findings.push({
            id: 'dns-spf-configured',
            name: 'Sender Policy Framework (SPF) Record Configured',
            category: 'DNS_SECURITY',
            severity: 'INFORMATIONAL',
            evidence: `SPF Record: ${spf}`,
            observedValue: spf,
            expectedValue: 'Valid SPF record',
            description: 'Domain publishes an SPF record preventing unauthorized mail servers from sending email.',
            recommendation: 'Regularly audit authorized sender IP addresses and include mechanisms in SPF.',
            references: ['https://www.rfc-editor.org/rfc/rfc7208'],
            status: 'INFORMATIONAL',
          });
        }
      } else {
        // Missing SPF
        findings.push({
          id: 'dns-missing-spf',
          name: 'Missing Sender Policy Framework (SPF) Record',
          category: 'DNS_SECURITY',
          severity: 'MEDIUM',
          evidence: `No TXT record starting with 'v=spf1' found on domain ${domain}.`,
          observedValue: 'No SPF record found',
          expectedValue: 'v=spf1 include:_spf.example.com ~all',
          description: 'Without an SPF record, adversaries can easily forge emails claiming to originate from your domain for phishing campaigns.',
          recommendation: 'Publish a TXT record with SPF definition designating your authorized mail relays.',
          remediationSnippet: `${domain}. IN TXT "v=spf1 -all" (if no mail sent) OR "v=spf1 include:mailprovider.com ~all"`,
          references: ['https://cheatsheetseries.owasp.org/cheatsheets/Email_Security_Cheat_Sheet.html'],
          status: 'CONFIRMED',
        });
      }
    } catch {
      // DNS TXT query failed or domain has no TXT records
      findings.push({
        id: 'dns-missing-spf',
        name: 'Missing Sender Policy Framework (SPF) Record',
        category: 'DNS_SECURITY',
        severity: 'MEDIUM',
        evidence: `DNS TXT lookup failed or returned no records for domain ${domain}.`,
        observedValue: 'No TXT records found',
        expectedValue: 'v=spf1 ... ~all',
        description: 'Without SPF, the domain has no declared email sender authorization list.',
        recommendation: 'Configure an SPF TXT record for your domain.',
        references: ['https://cheatsheetseries.owasp.org/cheatsheets/Email_Security_Cheat_Sheet.html'],
        status: 'POTENTIAL_WEAKNESS',
      });
    }

    // 3. Check DMARC at _dmarc.<domain>
    try {
      const dmarcTxt = await dns.promises.resolveTxt(`_dmarc.${domain}`);
      const flatDmarc = dmarcTxt.flat();
      const dmarc = flatDmarc.find(t => t.toLowerCase().startsWith('v=dmarc1'));

      if (dmarc) {
        hasDmarc = true;
        dmarcRecord = dmarc;

        if (dmarc.toLowerCase().includes('p=none')) {
          findings.push({
            id: 'dns-dmarc-policy-none',
            name: 'DMARC Policy Set to "none" (Monitoring Only)',
            category: 'DNS_SECURITY',
            severity: 'LOW',
            evidence: `DMARC Record: ${dmarc}`,
            observedValue: 'p=none',
            expectedValue: 'p=quarantine or p=reject',
            description: 'A DMARC policy of p=none provides reporting but does not instruct recipient mail servers to block fraudulent spoofed emails.',
            recommendation: 'Gradually transition your DMARC policy from p=none to p=quarantine and ultimately p=reject.',
            remediationSnippet: `_dmarc.${domain}. IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc-reports@${domain};"`,
            references: ['https://www.rfc-editor.org/rfc/rfc7489'],
            status: 'POTENTIAL_WEAKNESS',
          });
        } else {
          findings.push({
            id: 'dns-dmarc-enforced',
            name: 'Enforced DMARC Policy Active',
            category: 'DNS_SECURITY',
            severity: 'INFORMATIONAL',
            evidence: `DMARC Record: ${dmarc}`,
            observedValue: dmarc,
            expectedValue: 'p=quarantine or p=reject',
            description: 'Strong DMARC enforcement detected protecting your brand and users from domain spoofing attacks.',
            recommendation: 'Regularly monitor aggregate DMARC reports (rua/ruf).',
            references: ['https://www.rfc-editor.org/rfc/rfc7489'],
            status: 'INFORMATIONAL',
          });
        }
      } else {
        findings.push({
          id: 'dns-missing-dmarc',
          name: 'Missing DMARC DNS Record',
          category: 'DNS_SECURITY',
          severity: 'MEDIUM',
          evidence: `No DMARC TXT record found at _dmarc.${domain}`,
          observedValue: 'DMARC record absent',
          expectedValue: 'v=DMARC1; p=quarantine; ...',
          description: 'Without DMARC (Domain-based Message Authentication, Reporting, and Conformance), receivers cannot verify domain integrity against SPF/DKIM alignment.',
          recommendation: 'Create a TXT record for _dmarc.' + domain + ' with a baseline DMARC policy.',
          remediationSnippet: `_dmarc.${domain}. IN TXT "v=DMARC1; p=quarantine; sp=quarantine; pct=100;"`,
          references: ['https://dmarc.org/overview/'],
          status: 'CONFIRMED',
        });
      }
    } catch {
      findings.push({
        id: 'dns-missing-dmarc',
        name: 'Missing DMARC DNS Record',
        category: 'DNS_SECURITY',
        severity: 'MEDIUM',
        evidence: `No DNS TXT record found at _dmarc.${domain}`,
        observedValue: 'No record',
        expectedValue: 'v=DMARC1; p=quarantine; ...',
        description: 'DMARC record is not published for this domain.',
        recommendation: 'Publish a DMARC policy to protect your domain reputation.',
        references: ['https://dmarc.org/overview/'],
        status: 'CONFIRMED',
      });
    }

    return {
      hasSpf,
      spfRecord,
      hasDmarc,
      dmarcRecord,
      hasMx,
      mxRecords,
      findings,
    };
  }
}
