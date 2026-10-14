import { SeasonalDomainAudit } from "./seasonal-domain-audit.js";

/** A rule a seasonal domain audit must pass. Check returns its problems, or none. */
export interface SeasonalDomainAuditRule {
  check(item: SeasonalDomainAudit): string[];
}

export class SeasonalDomainAuditReviewerLengthRule implements SeasonalDomainAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDomainAudit): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDomainAuditRequiredCodeRule implements SeasonalDomainAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDomainAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalDomainAuditCodeLengthRule implements SeasonalDomainAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDomainAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal domain audit. */
export class SeasonalDomainAuditValidator {
  rules: SeasonalDomainAuditRule[];

  constructor(rules: SeasonalDomainAuditRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalDomainAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalDomainAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalDomainAudit[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultSeasonalDomainAuditValidator(): SeasonalDomainAuditValidator {
  return new SeasonalDomainAuditValidator(
    [
      new SeasonalDomainAuditReviewerLengthRule(3600),
      new SeasonalDomainAuditRequiredCodeRule("seasonal domain audit needs this field"),
      new SeasonalDomainAuditCodeLengthRule(80),
    ],
  );
}
