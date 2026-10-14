import * as text from "../../../../kit/text.js";
import { FallbackSlaTier } from "./fallback-sla-tier.js";

/** A rule a fallback sla tier must pass. Check returns its problems, or none. */
export interface FallbackSlaTierRule {
  check(item: FallbackSlaTier): string[];
}

export class FallbackSlaTierCodePrefixRule implements FallbackSlaTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackSlaTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackSlaTierAllowedPhoneRule implements FallbackSlaTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackSlaTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is missing`];
    return [];
  }
}

export class FallbackSlaTierImpressionsRangeRule implements FallbackSlaTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSlaTier): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackSlaTierRequiredCodeRule implements FallbackSlaTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSlaTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback sla tier. */
export class FallbackSlaTierValidator {
  rules: FallbackSlaTierRule[];

  constructor(rules: FallbackSlaTierRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSlaTier): string[] {
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

  requireValid(item: FallbackSlaTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSlaTier[]): Map<string, string[]> {
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

export function defaultFallbackSlaTierValidator(): FallbackSlaTierValidator {
  return new FallbackSlaTierValidator(
    [
      new FallbackSlaTierCodePrefixRule("Q"),
      new FallbackSlaTierAllowedPhoneRule([]),
      new FallbackSlaTierImpressionsRangeRule(120, 86400),
      new FallbackSlaTierRequiredCodeRule("fallback sla tier needs a value"),
    ],
  );
}
