import { RetentionPolicy } from "./retention-policy.js";

/** A rule a retention policy must pass. Check returns its problems, or none. */
export interface RetentionPolicyRule {
  check(item: RetentionPolicy): string[];
}

export class RetentionPolicyGraceDaysRangeRule implements RetentionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionPolicy): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionPolicyNameLengthRule implements RetentionPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionPolicyRatioRangeRule implements RetentionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionPolicy): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionPolicyCodePrefixRule implements RetentionPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a retention policy. */
export class RetentionPolicyValidator {
  rules: RetentionPolicyRule[];

  constructor(rules: RetentionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionPolicy): string[] {
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

  requireValid(item: RetentionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionPolicy[]): Map<string, string[]> {
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

export function defaultRetentionPolicyValidator(): RetentionPolicyValidator {
  return new RetentionPolicyValidator(
    [
      new RetentionPolicyGraceDaysRangeRule(120, 3600),
      new RetentionPolicyNameLengthRule(32),
      new RetentionPolicyRatioRangeRule(1.2, 4869.1),
      new RetentionPolicyCodePrefixRule("OPS"),
    ],
  );
}
