import { GlobalPostRollup } from "./global-post-rollup.js";

/** A rule a global post rollup must pass. Check returns its problems, or none. */
export interface GlobalPostRollupRule {
  check(item: GlobalPostRollup): string[];
}

export class GlobalPostRollupPinnedGuardRule implements GlobalPostRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalPostRollup): string[] {
    if (item.pinned && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class GlobalPostRollupNameLengthRule implements GlobalPostRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPostRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPostRollupCodePrefixRule implements GlobalPostRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalPostRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalPostRollupQuantityRangeRule implements GlobalPostRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPostRollup): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalPostRollupLabelLengthRule implements GlobalPostRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPostRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPostRollupRequiredNameRule implements GlobalPostRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPostRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global post rollup. */
export class GlobalPostRollupValidator {
  rules: GlobalPostRollupRule[];

  constructor(rules: GlobalPostRollupRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPostRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalPostRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPostRollup[]): Map<string, string[]> {
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

export function defaultGlobalPostRollupValidator(): GlobalPostRollupValidator {
  return new GlobalPostRollupValidator(
    [
      new GlobalPostRollupPinnedGuardRule(32),
      new GlobalPostRollupNameLengthRule(3600),
      new GlobalPostRollupCodePrefixRule("X"),
      new GlobalPostRollupQuantityRangeRule(16, 3600),
      new GlobalPostRollupLabelLengthRule(86400),
      new GlobalPostRollupRequiredNameRule("global post rollup needs an entry"),
    ],
  );
}
