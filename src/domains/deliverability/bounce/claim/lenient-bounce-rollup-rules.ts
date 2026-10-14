import { LenientBounceRollup } from "./lenient-bounce-rollup.js";

/** A rule a lenient bounce rollup must pass. Check returns its problems, or none. */
export interface LenientBounceRollupRule {
  check(item: LenientBounceRollup): string[];
}

export class LenientBounceRollupRequiredCodeRule implements LenientBounceRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBounceRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBounceRollupRequiredExternalRefRule implements LenientBounceRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBounceRollup): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBounceRollupRequiredLocaleRule implements LenientBounceRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBounceRollup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBounceRollupAttemptsRangeRule implements LenientBounceRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientBounceRollup): string[] {
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

export class LenientBounceRollupExternalRefLengthRule implements LenientBounceRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBounceRollup): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient bounce rollup. */
export class LenientBounceRollupValidator {
  rules: LenientBounceRollupRule[];

  constructor(rules: LenientBounceRollupRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBounceRollup): string[] {
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

  requireValid(item: LenientBounceRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBounceRollup[]): Map<string, string[]> {
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

export function defaultLenientBounceRollupValidator(): LenientBounceRollupValidator {
  return new LenientBounceRollupValidator(
    [
      new LenientBounceRollupRequiredCodeRule("lenient bounce rollup needs a value"),
      new LenientBounceRollupRequiredExternalRefRule("lenient bounce rollup needs an entry"),
      new LenientBounceRollupRequiredLocaleRule("lenient bounce rollup needs an entry"),
      new LenientBounceRollupAttemptsRangeRule(120, 120),
      new LenientBounceRollupExternalRefLengthRule(255),
    ],
  );
}
