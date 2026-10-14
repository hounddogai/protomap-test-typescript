import { ManualSlaQuota } from "./manual-sla-quota.js";

/** A rule a manual sla quota must pass. Check returns its problems, or none. */
export interface ManualSlaQuotaRule {
  check(item: ManualSlaQuota): string[];
}

export class ManualSlaQuotaBatchSizeRangeRule implements ManualSlaQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualSlaQuota): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualSlaQuotaRequiredLabelRule implements ManualSlaQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSlaQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualSlaQuotaRequiredCodeRule implements ManualSlaQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSlaQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualSlaQuotaLabelLengthRule implements ManualSlaQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualSlaQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual sla quota. */
export class ManualSlaQuotaValidator {
  rules: ManualSlaQuotaRule[];

  constructor(rules: ManualSlaQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSlaQuota): string[] {
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

  requireValid(item: ManualSlaQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSlaQuota[]): Map<string, string[]> {
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

export function defaultManualSlaQuotaValidator(): ManualSlaQuotaValidator {
  return new ManualSlaQuotaValidator(
    [
      new ManualSlaQuotaBatchSizeRangeRule(80, 120),
      new ManualSlaQuotaRequiredLabelRule("manual sla quota needs this field"),
      new ManualSlaQuotaRequiredCodeRule("manual sla quota needs an entry"),
      new ManualSlaQuotaLabelLengthRule(32),
    ],
  );
}
