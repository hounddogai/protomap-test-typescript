import { NudgeTier } from "./nudge-tier.js";

/** A rule a nudge tier must pass. Check returns its problems, or none. */
export interface NudgeTierRule {
  check(item: NudgeTier): string[];
}

export class NudgeTierFloorValueRangeRule implements NudgeTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeTier): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeTierNameLengthRule implements NudgeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeTier): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeTierCodeLengthRule implements NudgeTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a nudge tier. */
export class NudgeTierValidator {
  rules: NudgeTierRule[];

  constructor(rules: NudgeTierRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeTier[]): Map<string, string[]> {
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

export function defaultNudgeTierValidator(): NudgeTierValidator {
  return new NudgeTierValidator(
    [
      new NudgeTierFloorValueRangeRule(0.3, 542.7),
      new NudgeTierNameLengthRule(3600),
      new NudgeTierCodeLengthRule(3600),
    ],
  );
}
