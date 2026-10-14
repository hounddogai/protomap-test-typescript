import { ManualRetentionQuota } from "./manual-retention-quota.js";

/** A rule a manual retention quota must pass. Check returns its problems, or none. */
export interface ManualRetentionQuotaRule {
  check(item: ManualRetentionQuota): string[];
}

export class ManualRetentionQuotaRequiredCodeRule implements ManualRetentionQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRetentionQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRetentionQuotaCodeLengthRule implements ManualRetentionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRetentionQuota): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRetentionQuotaChannelLengthRule implements ManualRetentionQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRetentionQuota): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual retention quota. */
export class ManualRetentionQuotaValidator {
  rules: ManualRetentionQuotaRule[];

  constructor(rules: ManualRetentionQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRetentionQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualRetentionQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRetentionQuota[]): Map<string, string[]> {
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

export function defaultManualRetentionQuotaValidator(): ManualRetentionQuotaValidator {
  return new ManualRetentionQuotaValidator(
    [
      new ManualRetentionQuotaRequiredCodeRule("manual retention quota needs a value"),
      new ManualRetentionQuotaCodeLengthRule(255),
      new ManualRetentionQuotaChannelLengthRule(1000),
    ],
  );
}
