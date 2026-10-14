import { LegacyReputationQuota } from "./legacy-reputation-quota.js";

/** A rule a legacy reputation quota must pass. Check returns its problems, or none. */
export interface LegacyReputationQuotaRule {
  check(item: LegacyReputationQuota): string[];
}

export class LegacyReputationQuotaLabelLengthRule implements LegacyReputationQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyReputationQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyReputationQuotaRequiredNotesRule implements LegacyReputationQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyReputationQuota): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyReputationQuotaFrequencyCapRangeRule implements LegacyReputationQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyReputationQuota): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy reputation quota. */
export class LegacyReputationQuotaValidator {
  rules: LegacyReputationQuotaRule[];

  constructor(rules: LegacyReputationQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyReputationQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyReputationQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyReputationQuota[]): Map<string, string[]> {
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

export function defaultLegacyReputationQuotaValidator(): LegacyReputationQuotaValidator {
  return new LegacyReputationQuotaValidator(
    [
      new LegacyReputationQuotaLabelLengthRule(255),
      new LegacyReputationQuotaRequiredNotesRule("legacy reputation quota needs an entry"),
      new LegacyReputationQuotaFrequencyCapRangeRule(1000, 86400),
    ],
  );
}
