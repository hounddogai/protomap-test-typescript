import { BounceQuota } from "./bounce-quota.js";

/** A rule a bounce quota must pass. Check returns its problems, or none. */
export interface BounceQuotaRule {
  check(item: BounceQuota): string[];
}

export class BounceQuotaCurrencyLengthRule implements BounceQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceQuota): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceQuotaRequiredCurrencyRule implements BounceQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceQuota): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class BounceQuotaRequiredChannelRule implements BounceQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceQuota): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bounce quota. */
export class BounceQuotaValidator {
  rules: BounceQuotaRule[];

  constructor(rules: BounceQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: BounceQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceQuota[]): Map<string, string[]> {
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

export function defaultBounceQuotaValidator(): BounceQuotaValidator {
  return new BounceQuotaValidator(
    [
      new BounceQuotaCurrencyLengthRule(3600),
      new BounceQuotaRequiredCurrencyRule("bounce quota needs a value"),
      new BounceQuotaRequiredChannelRule("bounce quota needs a value"),
    ],
  );
}
