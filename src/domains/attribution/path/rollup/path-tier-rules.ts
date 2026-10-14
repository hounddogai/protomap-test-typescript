import { PathTier } from "./path-tier.js";

/** A rule a path tier must pass. Check returns its problems, or none. */
export interface PathTierRule {
  check(item: PathTier): string[];
}

export class PathTierCodeLengthRule implements PathTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathTierLimitRangeRule implements PathTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathTier): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathTierRequiredTitleRule implements PathTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path tier. */
export class PathTierValidator {
  rules: PathTierRule[];

  constructor(rules: PathTierRule[]) {
    this.rules = rules;
  }

  validate(item: PathTier): string[] {
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

  requireValid(item: PathTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathTier[]): Map<string, string[]> {
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

export function defaultPathTierValidator(): PathTierValidator {
  return new PathTierValidator(
    [
      new PathTierCodeLengthRule(64),
      new PathTierLimitRangeRule(120, 3600),
      new PathTierRequiredTitleRule("path tier needs a value"),
    ],
  );
}
