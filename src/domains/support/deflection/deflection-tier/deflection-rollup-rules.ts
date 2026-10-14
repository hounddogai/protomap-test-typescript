import { DeflectionRollup } from "./deflection-rollup.js";

/** A rule a deflection rollup must pass. Check returns its problems, or none. */
export interface DeflectionRollupRule {
  check(item: DeflectionRollup): string[];
}

export class DeflectionRollupCodePrefixRule implements DeflectionRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DeflectionRollupRequiredCodeRule implements DeflectionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionRollupExternalRefLengthRule implements DeflectionRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionRollup): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionRollupStartsAtRangeRule implements DeflectionRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionRollup): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionRollupRateRangeRule implements DeflectionRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionRollup): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a deflection rollup. */
export class DeflectionRollupValidator {
  rules: DeflectionRollupRule[];

  constructor(rules: DeflectionRollupRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionRollup): string[] {
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

  requireValid(item: DeflectionRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionRollup[]): Map<string, string[]> {
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

export function defaultDeflectionRollupValidator(): DeflectionRollupValidator {
  return new DeflectionRollupValidator(
    [
      new DeflectionRollupCodePrefixRule("OPS"),
      new DeflectionRollupRequiredCodeRule("deflection rollup needs an entry"),
      new DeflectionRollupExternalRefLengthRule(80),
      new DeflectionRollupStartsAtRangeRule(64, 3600),
      new DeflectionRollupRateRangeRule(6.3, 2192.7),
    ],
  );
}
