import { FallbackPathQuota } from "./fallback-path-quota.js";

/** A rule a fallback path quota must pass. Check returns its problems, or none. */
export interface FallbackPathQuotaRule {
  check(item: FallbackPathQuota): string[];
}

export class FallbackPathQuotaCodePrefixRule implements FallbackPathQuotaRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackPathQuota): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackPathQuotaCostRangeRule implements FallbackPathQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPathQuota): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPathQuotaRequiredLabelRule implements FallbackPathQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPathQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPathQuotaLabelLengthRule implements FallbackPathQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPathQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback path quota. */
export class FallbackPathQuotaValidator {
  rules: FallbackPathQuotaRule[];

  constructor(rules: FallbackPathQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPathQuota): string[] {
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

  requireValid(item: FallbackPathQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPathQuota[]): Map<string, string[]> {
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

export function defaultFallbackPathQuotaValidator(): FallbackPathQuotaValidator {
  return new FallbackPathQuotaValidator(
    [
      new FallbackPathQuotaCodePrefixRule("REF"),
      new FallbackPathQuotaCostRangeRule(5.5, 3365.6),
      new FallbackPathQuotaRequiredLabelRule("fallback path quota needs a value"),
      new FallbackPathQuotaLabelLengthRule(32),
    ],
  );
}
