import * as text from "../../../../kit/text.js";
import { GlobalPreferenceTier } from "./global-preference-tier.js";

/** A rule a global preference tier must pass. Check returns its problems, or none. */
export interface GlobalPreferenceTierRule {
  check(item: GlobalPreferenceTier): string[];
}

export class GlobalPreferenceTierPinnedGuardRule implements GlobalPreferenceTierRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalPreferenceTier): string[] {
    if (item.pinned && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class GlobalPreferenceTierCodePrefixRule implements GlobalPreferenceTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalPreferenceTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalPreferenceTierFrequencyCapRangeRule implements GlobalPreferenceTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPreferenceTier): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalPreferenceTierRequiredReviewerRule implements GlobalPreferenceTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPreferenceTier): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPreferenceTierAllowedCodeRule implements GlobalPreferenceTierRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalPreferenceTier): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

/** Runs every rule of a global preference tier. */
export class GlobalPreferenceTierValidator {
  rules: GlobalPreferenceTierRule[];

  constructor(rules: GlobalPreferenceTierRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPreferenceTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalPreferenceTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPreferenceTier[]): Map<string, string[]> {
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

export function defaultGlobalPreferenceTierValidator(): GlobalPreferenceTierValidator {
  return new GlobalPreferenceTierValidator(
    [
      new GlobalPreferenceTierPinnedGuardRule(1000),
      new GlobalPreferenceTierCodePrefixRule("OPS"),
      new GlobalPreferenceTierFrequencyCapRangeRule(255, 255),
      new GlobalPreferenceTierRequiredReviewerRule("global preference tier needs a value"),
      new GlobalPreferenceTierAllowedCodeRule(["lenient"]),
    ],
  );
}
