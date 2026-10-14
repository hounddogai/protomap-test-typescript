import { StrictPostOverride } from "./strict-post-override.js";

/** A rule a strict post override must pass. Check returns its problems, or none. */
export interface StrictPostOverrideRule {
  check(item: StrictPostOverride): string[];
}

export class StrictPostOverrideCodePrefixRule implements StrictPostOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictPostOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictPostOverrideCodeLengthRule implements StrictPostOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPostOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPostOverrideWeightRangeRule implements StrictPostOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPostOverride): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPostOverrideNameLengthRule implements StrictPostOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPostOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict post override. */
export class StrictPostOverrideValidator {
  rules: StrictPostOverrideRule[];

  constructor(rules: StrictPostOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPostOverride): string[] {
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

  requireValid(item: StrictPostOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPostOverride[]): Map<string, string[]> {
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

export function defaultStrictPostOverrideValidator(): StrictPostOverrideValidator {
  return new StrictPostOverrideValidator(
    [
      new StrictPostOverrideCodePrefixRule("X"),
      new StrictPostOverrideCodeLengthRule(120),
      new StrictPostOverrideWeightRangeRule(7.1, 419.4),
      new StrictPostOverrideNameLengthRule(86400),
    ],
  );
}
