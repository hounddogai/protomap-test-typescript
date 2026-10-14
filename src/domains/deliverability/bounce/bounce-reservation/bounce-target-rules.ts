import * as text from "../../../../kit/text.js";
import { BounceTarget } from "./bounce-target.js";

/** A rule a bounce target must pass. Check returns its problems, or none. */
export interface BounceTargetRule {
  check(item: BounceTarget): string[];
}

export class BounceTargetMinimumRangeRule implements BounceTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceTarget): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BounceTargetVisibleGuardRule implements BounceTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BounceTarget): string[] {
    if (item.visible && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class BounceTargetRequiredCodeRule implements BounceTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BounceTargetAllowedCodeRule implements BounceTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BounceTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class BounceTargetCodePrefixRule implements BounceTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BounceTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a bounce target. */
export class BounceTargetValidator {
  rules: BounceTargetRule[];

  constructor(rules: BounceTargetRule[]) {
    this.rules = rules;
  }

  validate(item: BounceTarget): string[] {
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

  requireValid(item: BounceTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceTarget[]): Map<string, string[]> {
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

export function defaultBounceTargetValidator(): BounceTargetValidator {
  return new BounceTargetValidator(
    [
      new BounceTargetMinimumRangeRule(6.4, 681.4),
      new BounceTargetVisibleGuardRule(16),
      new BounceTargetRequiredCodeRule("bounce target needs this field"),
      new BounceTargetAllowedCodeRule(["global", "global"]),
      new BounceTargetCodePrefixRule("OPS"),
    ],
  );
}
