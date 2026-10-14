import { SeasonalPaywallQuota } from "./seasonal-paywall-quota.js";

/** A rule a seasonal paywall quota must pass. Check returns its problems, or none. */
export interface SeasonalPaywallQuotaRule {
  check(item: SeasonalPaywallQuota): string[];
}

export class SeasonalPaywallQuotaRequiredPhoneRule implements SeasonalPaywallQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPaywallQuota): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPaywallQuotaCodePrefixRule implements SeasonalPaywallQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalPaywallQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalPaywallQuotaPhoneLengthRule implements SeasonalPaywallQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallQuota): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPaywallQuotaCreatedAtRangeRule implements SeasonalPaywallQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPaywallQuota): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalPaywallQuotaAttemptsRangeRule implements SeasonalPaywallQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPaywallQuota): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalPaywallQuotaCohortLengthRule implements SeasonalPaywallQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPaywallQuota): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal paywall quota. */
export class SeasonalPaywallQuotaValidator {
  rules: SeasonalPaywallQuotaRule[];

  constructor(rules: SeasonalPaywallQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPaywallQuota): string[] {
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

  requireValid(item: SeasonalPaywallQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPaywallQuota[]): Map<string, string[]> {
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

export function defaultSeasonalPaywallQuotaValidator(): SeasonalPaywallQuotaValidator {
  return new SeasonalPaywallQuotaValidator(
    [
      new SeasonalPaywallQuotaRequiredPhoneRule("seasonal paywall quota needs a value"),
      new SeasonalPaywallQuotaCodePrefixRule("Q"),
      new SeasonalPaywallQuotaPhoneLengthRule(3600),
      new SeasonalPaywallQuotaCreatedAtRangeRule(120, 1000),
      new SeasonalPaywallQuotaAttemptsRangeRule(64, 1000),
      new SeasonalPaywallQuotaCohortLengthRule(64),
    ],
  );
}
