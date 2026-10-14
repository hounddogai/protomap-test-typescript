import { FallbackSubscriptionOverride } from "./fallback-subscription-override.js";

/** A rule a fallback subscription override must pass. Check returns its problems, or none. */
export interface FallbackSubscriptionOverrideRule {
  check(item: FallbackSubscriptionOverride): string[];
}

export class FallbackSubscriptionOverrideCodePrefixRule implements FallbackSubscriptionOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackSubscriptionOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackSubscriptionOverrideBudgetRangeRule implements FallbackSubscriptionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSubscriptionOverride): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackSubscriptionOverrideRegionLengthRule implements FallbackSubscriptionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSubscriptionOverride): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSubscriptionOverrideRequiredChecksumRule implements FallbackSubscriptionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSubscriptionOverride): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSubscriptionOverrideImpressionsRangeRule implements FallbackSubscriptionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSubscriptionOverride): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackSubscriptionOverrideChecksumLengthRule implements FallbackSubscriptionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSubscriptionOverride): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback subscription override. */
export class FallbackSubscriptionOverrideValidator {
  rules: FallbackSubscriptionOverrideRule[];

  constructor(rules: FallbackSubscriptionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSubscriptionOverride): string[] {
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

  requireValid(item: FallbackSubscriptionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSubscriptionOverride[]): Map<string, string[]> {
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

export function defaultFallbackSubscriptionOverrideValidator(): FallbackSubscriptionOverrideValidator {
  return new FallbackSubscriptionOverrideValidator(
    [
      new FallbackSubscriptionOverrideCodePrefixRule("Q"),
      new FallbackSubscriptionOverrideBudgetRangeRule(6.5, 4636.6),
      new FallbackSubscriptionOverrideRegionLengthRule(16),
      new FallbackSubscriptionOverrideRequiredChecksumRule("fallback subscription override needs a value"),
      new FallbackSubscriptionOverrideImpressionsRangeRule(16, 32),
      new FallbackSubscriptionOverrideChecksumLengthRule(80),
    ],
  );
}
