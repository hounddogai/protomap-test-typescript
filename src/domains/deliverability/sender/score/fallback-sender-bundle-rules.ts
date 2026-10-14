import * as text from "../../../../kit/text.js";
import { FallbackSenderBundle } from "./fallback-sender-bundle.js";

/** A rule a fallback sender bundle must pass. Check returns its problems, or none. */
export interface FallbackSenderBundleRule {
  check(item: FallbackSenderBundle): string[];
}

export class FallbackSenderBundleAllowedTitleRule implements FallbackSenderBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackSenderBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

export class FallbackSenderBundleCodePrefixRule implements FallbackSenderBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackSenderBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackSenderBundleQuantityRangeRule implements FallbackSenderBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSenderBundle): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackSenderBundleRequiredCodeRule implements FallbackSenderBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSenderBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSenderBundleTitleLengthRule implements FallbackSenderBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSenderBundle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback sender bundle. */
export class FallbackSenderBundleValidator {
  rules: FallbackSenderBundleRule[];

  constructor(rules: FallbackSenderBundleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSenderBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackSenderBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSenderBundle[]): Map<string, string[]> {
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

export function defaultFallbackSenderBundleValidator(): FallbackSenderBundleValidator {
  return new FallbackSenderBundleValidator(
    [
      new FallbackSenderBundleAllowedTitleRule(["tiered", "fallback"]),
      new FallbackSenderBundleCodePrefixRule("ACM"),
      new FallbackSenderBundleQuantityRangeRule(80, 86400),
      new FallbackSenderBundleRequiredCodeRule("fallback sender bundle needs a value"),
      new FallbackSenderBundleTitleLengthRule(1000),
    ],
  );
}
