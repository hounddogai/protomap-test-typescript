import * as text from "../../../../kit/text.js";
import { WaitTier } from "./wait-tier.js";

/** A rule a wait tier must pass. Check returns its problems, or none. */
export interface WaitTierRule {
  check(item: WaitTier): string[];
}

export class WaitTierAllowedLabelRule implements WaitTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

export class WaitTierRequiredExternalRefRule implements WaitTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitTier): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class WaitTierRequiredCodeRule implements WaitTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitTierCodePrefixRule implements WaitTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitTierEndsAtRangeRule implements WaitTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitTier): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a wait tier. */
export class WaitTierValidator {
  rules: WaitTierRule[];

  constructor(rules: WaitTierRule[]) {
    this.rules = rules;
  }

  validate(item: WaitTier): string[] {
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

  requireValid(item: WaitTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitTier[]): Map<string, string[]> {
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

export function defaultWaitTierValidator(): WaitTierValidator {
  return new WaitTierValidator(
    [
      new WaitTierAllowedLabelRule([]),
      new WaitTierRequiredExternalRefRule("wait tier needs an entry"),
      new WaitTierRequiredCodeRule("wait tier needs a value"),
      new WaitTierCodePrefixRule("Q"),
      new WaitTierEndsAtRangeRule(255, 86400),
    ],
  );
}
