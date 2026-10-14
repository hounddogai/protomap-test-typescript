import { RollingWaitBaseline } from "./rolling-wait-baseline.js";

/** A rule a rolling wait baseline must pass. Check returns its problems, or none. */
export interface RollingWaitBaselineRule {
  check(item: RollingWaitBaseline): string[];
}

export class RollingWaitBaselineRequiredCodeRule implements RollingWaitBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWaitBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWaitBaselineMinimumRangeRule implements RollingWaitBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWaitBaseline): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingWaitBaselineCodePrefixRule implements RollingWaitBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingWaitBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingWaitBaselineEndsAtRangeRule implements RollingWaitBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWaitBaseline): string[] {
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

/** Runs every rule of a rolling wait baseline. */
export class RollingWaitBaselineValidator {
  rules: RollingWaitBaselineRule[];

  constructor(rules: RollingWaitBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWaitBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingWaitBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWaitBaseline[]): Map<string, string[]> {
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

export function defaultRollingWaitBaselineValidator(): RollingWaitBaselineValidator {
  return new RollingWaitBaselineValidator(
    [
      new RollingWaitBaselineRequiredCodeRule("rolling wait baseline needs a value"),
      new RollingWaitBaselineMinimumRangeRule(1.2, 3781.7),
      new RollingWaitBaselineCodePrefixRule("OPS"),
      new RollingWaitBaselineEndsAtRangeRule(32, 255),
    ],
  );
}
