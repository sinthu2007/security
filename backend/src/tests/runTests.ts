import { SsrfValidator } from '../services/scanner/ssrfValidator';
import { RiskScorer } from '../services/scanner/riskScorer';
import { AiAdvisor } from '../services/scanner/aiAdvisor';
import { ISecurityFinding } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   AEGISGUARD AI - AUTOMATED SECURITY TEST SUITE');
  console.log('======================================================\n');

  // -----------------------------------------------------------------
  // 1. SSRF & URL Safety Validation Tests
  // -----------------------------------------------------------------
  console.log('--- 1. SSRF Shield & URL Validation Tests ---');

  const localhostCheck = await SsrfValidator.validateUrl('http://localhost:5000');
  assert(!localhostCheck.isValid, 'Blocks localhost domain');

  const loopbackIpCheck = await SsrfValidator.validateUrl('http://127.0.0.1:8080');
  assert(!loopbackIpCheck.isValid, 'Blocks IPv4 loopback (127.0.0.1)');

  const privateIpCheck1 = await SsrfValidator.validateUrl('http://192.168.1.100');
  assert(!privateIpCheck1.isValid, 'Blocks RFC 1918 Class C private IP (192.168.1.100)');

  const privateIpCheck2 = await SsrfValidator.validateUrl('http://10.0.0.50');
  assert(!privateIpCheck2.isValid, 'Blocks RFC 1918 Class A private IP (10.0.0.50)');

  const metadataCheck = await SsrfValidator.validateUrl('http://169.254.169.254/latest/meta-data');
  assert(!metadataCheck.isValid, 'Blocks Cloud Provider Metadata IP (169.254.169.254)');

  const invalidProtocolCheck = await SsrfValidator.validateUrl('ftp://example.com');
  assert(!invalidProtocolCheck.isValid, 'Rejects non-HTTP/HTTPS protocol (ftp://)');

  const invalidPortCheck = await SsrfValidator.validateUrl('http://example.com:22');
  assert(!invalidPortCheck.isValid, 'Rejects non-standard web ports (port 22)');

  // -----------------------------------------------------------------
  // 2. Risk Scorer Deterministic Calculation Tests
  // -----------------------------------------------------------------
  console.log('\n--- 2. Deterministic Risk Scoring & Grade Tests ---');

  // Baseline: no findings -> score 100, Grade A+
  const baseline = RiskScorer.calculate([]);
  assert(baseline.riskScore === 100, 'Baseline score equals 100 with 0 findings');
  assert(baseline.securityGrade === 'A+', 'Baseline grade equals A+');

  // 1 Critical finding -> -25 points -> score 75, Grade B
  const testFindings1: ISecurityFinding[] = [
    {
      id: 'crit-1',
      name: 'Test Critical Vulnerability',
      category: 'SSL_TLS',
      severity: 'CRITICAL',
      evidence: 'SSL failed',
      observedValue: 'Expired',
      expectedValue: 'Valid',
      description: 'Test',
      recommendation: 'Fix',
      references: [],
      status: 'CONFIRMED',
    },
  ];

  const result1 = RiskScorer.calculate(testFindings1);
  assert(result1.riskScore === 75, 'Critical finding deducts 25 points (100 - 25 = 75)');
  assert(result1.securityGrade === 'B', 'Score 75 maps to Grade B');
  assert(result1.summary.critical === 1, 'Summary accurately increments critical count');

  // 1 Critical (-25) + 2 High (-30) + 1 Medium (-8) -> 100 - 63 = 37 -> Grade F
  const testFindings2: ISecurityFinding[] = [
    testFindings1[0],
    {
      id: 'high-1',
      name: 'Insecure Protocol',
      category: 'SSL_TLS',
      severity: 'HIGH',
      evidence: 'TLSv1.0',
      observedValue: 'TLSv1.0',
      expectedValue: 'TLSv1.3',
      description: 'Test',
      recommendation: 'Fix',
      references: [],
      status: 'CONFIRMED',
    },
    {
      id: 'high-2',
      name: 'No HTTPS Redirect',
      category: 'SECURITY_HEADERS',
      severity: 'HIGH',
      evidence: 'Port 80 200 OK',
      observedValue: '200 OK',
      expectedValue: '301 Redirect',
      description: 'Test',
      recommendation: 'Fix',
      references: [],
      status: 'CONFIRMED',
    },
    {
      id: 'med-1',
      name: 'Missing CSP',
      category: 'SECURITY_HEADERS',
      severity: 'MEDIUM',
      evidence: 'Absent',
      observedValue: 'None',
      expectedValue: 'CSP set',
      description: 'Test',
      recommendation: 'Fix',
      references: [],
      status: 'CONFIRMED',
    },
  ];

  const result2 = RiskScorer.calculate(testFindings2);
  assert(result2.riskScore === 37, 'Penalties sum properly (100 - 25 - 15 - 15 - 8 = 37)');
  assert(result2.securityGrade === 'F', 'Score 37 maps to Grade F');
  assert(result2.summary.totalFindings === 4, 'Total findings equals 4');

  // -----------------------------------------------------------------
  // 3. AI Security Synthesis Tests
  // -----------------------------------------------------------------
  console.log('\n--- 3. AI Security Synthesis & Executive Summary Tests ---');

  const aiAnalysis = AiAdvisor.generateAnalysis(
    'https://example.com',
    'example.com',
    result2.riskScore,
    result2.securityGrade,
    result2.summary,
    testFindings2
  );

  assert(aiAnalysis.executiveSummary.length > 50, 'Generates comprehensive executive summary');
  assert(aiAnalysis.topPriorityActions.length >= 3, 'Ranks top 3 priority remediation action items');
  assert(aiAnalysis.complianceNotes.includes('non-invasive'), 'Includes non-invasive scope transparency disclaimer');

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
