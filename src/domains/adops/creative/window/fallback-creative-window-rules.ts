import * as text from "../../../../kit/text.js";
import { FallbackCreativeWindow } from "./fallback-creative-window.js";

/** A rule a fallback creative window must pass. Check returns its problems, or none. */
export interface FallbackCreativeWindowRule {
  check(item: FallbackCreativeWindow): string[];
}

export class FallbackCreativeWindowArchivedGuardRule implements FallbackCreativeWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackCreativeWindow): string[] {
    if (item.archived && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class FallbackCreativeWindowOpenRateRangeRule implements FallbackCreativeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCreativeWindow): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackCreativeWindowVersionRangeRule implements FallbackCreativeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCreativeWindow): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackCreativeWindowAllowedLabelRule implements FallbackCreativeWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackCreativeWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class FallbackCreativeWindowCodePrefixRule implements FallbackCreativeWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackCreativeWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackCreativeWindowCountryLengthRule implements FallbackCreativeWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCreativeWindow): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback creative window. */
export class FallbackCreativeWindowValidator {
  rules: FallbackCreativeWindowRule[];

  constructor(rules: FallbackCreativeWindowRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCreativeWindow): string[] {
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

  requireValid(item: FallbackCreativeWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCreativeWindow[]): Map<string, string[]> {
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

export function defaultFallbackCreativeWindowValidator(): FallbackCreativeWindowValidator {
  return new FallbackCreativeWindowValidator(
    [
      new FallbackCreativeWindowArchivedGuardRule(255),
      new FallbackCreativeWindowOpenRateRangeRule(4.2, 2400.7),
      new FallbackCreativeWindowVersionRangeRule(255, 86400),
      new FallbackCreativeWindowAllowedLabelRule([]),
      new FallbackCreativeWindowCodePrefixRule("ACM"),
      new FallbackCreativeWindowCountryLengthRule(120),
    ],
  );
}
