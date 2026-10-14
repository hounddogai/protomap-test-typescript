import { EscalationQuota } from "./escalation-quota.js";

/** A rule a escalation quota must pass. Check returns its problems, or none. */
export interface EscalationQuotaRule {
  check(item: EscalationQuota): string[];
}

export class EscalationQuotaRequiredLabelRule implements EscalationQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationQuotaRequiredOwnerIdRule implements EscalationQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationQuota): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationQuotaNameLengthRule implements EscalationQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationQuota): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation quota. */
export class EscalationQuotaValidator {
  rules: EscalationQuotaRule[];

  constructor(rules: EscalationQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationQuota[]): Map<string, string[]> {
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

export function defaultEscalationQuotaValidator(): EscalationQuotaValidator {
  return new EscalationQuotaValidator(
    [
      new EscalationQuotaRequiredLabelRule("escalation quota needs a value"),
      new EscalationQuotaRequiredOwnerIdRule("escalation quota needs an entry"),
      new EscalationQuotaNameLengthRule(3600),
    ],
  );
}
