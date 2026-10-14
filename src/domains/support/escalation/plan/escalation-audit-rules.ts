import { EscalationAudit } from "./escalation-audit.js";

/** A rule a escalation audit must pass. Check returns its problems, or none. */
export interface EscalationAuditRule {
  check(item: EscalationAudit): string[];
}

export class EscalationAuditRequiredCodeRule implements EscalationAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationAuditRequiredCampaignRefRule implements EscalationAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationAudit): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationAuditDiscountRangeRule implements EscalationAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationAudit): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a escalation audit. */
export class EscalationAuditValidator {
  rules: EscalationAuditRule[];

  constructor(rules: EscalationAuditRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationAudit): string[] {
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

  requireValid(item: EscalationAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationAudit[]): Map<string, string[]> {
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

export function defaultEscalationAuditValidator(): EscalationAuditValidator {
  return new EscalationAuditValidator(
    [
      new EscalationAuditRequiredCodeRule("escalation audit needs a value"),
      new EscalationAuditRequiredCampaignRefRule("escalation audit needs a value"),
      new EscalationAuditDiscountRangeRule(9.7, 282.4),
    ],
  );
}
