import { ISecurityFinding, IScanSummary, SecurityGrade, SeverityLevel } from '../../types';

export interface RiskCalculationResult {
  riskScore: number;
  securityGrade: SecurityGrade;
  summary: IScanSummary;
}

export class RiskScorer {
  // Documented Transparent Severity Penalties
  public static readonly PENALTIES: Record<SeverityLevel, number> = {
    CRITICAL: 25,
    HIGH: 15,
    MEDIUM: 8,
    LOW: 3,
    INFORMATIONAL: 0,
  };

  /**
   * Calculates overall risk score, security grade, and summary counts deterministically
   */
  public static calculate(findings: ISecurityFinding[]): RiskCalculationResult {
    let score = 100;
    const summary: IScanSummary = {
      totalFindings: findings.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0,
    };

    for (const finding of findings) {
      switch (finding.severity) {
        case 'CRITICAL':
          summary.critical++;
          score -= this.PENALTIES.CRITICAL;
          break;
        case 'HIGH':
          summary.high++;
          score -= this.PENALTIES.HIGH;
          break;
        case 'MEDIUM':
          summary.medium++;
          score -= this.PENALTIES.MEDIUM;
          break;
        case 'LOW':
          summary.low++;
          score -= this.PENALTIES.LOW;
          break;
        case 'INFORMATIONAL':
          summary.informational++;
          break;
      }
    }

    // Clamp score strictly between 0 and 100
    const riskScore = Math.max(0, Math.min(100, Math.round(score)));

    // Derive Security Grade
    let securityGrade: SecurityGrade = 'F';
    if (riskScore >= 90) {
      securityGrade = 'A+';
    } else if (riskScore >= 80) {
      securityGrade = 'A';
    } else if (riskScore >= 70) {
      securityGrade = 'B';
    } else if (riskScore >= 60) {
      securityGrade = 'C';
    } else if (riskScore >= 50) {
      securityGrade = 'D';
    } else {
      securityGrade = 'F';
    }

    return {
      riskScore,
      securityGrade,
      summary,
    };
  }
}
