import { DefaultRewardSegment } from "./default-reward-segment.js";

/** A rule a default reward segment must pass. Check returns its problems, or none. */
export interface DefaultRewardSegmentRule {
  check(item: DefaultRewardSegment): string[];
}

export class DefaultRewardSegmentRequiredTitleRule implements DefaultRewardSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRewardSegment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultRewardSegmentRequiredLocaleRule implements DefaultRewardSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRewardSegment): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultRewardSegmentWindowDaysRangeRule implements DefaultRewardSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRewardSegment): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default reward segment. */
export class DefaultRewardSegmentValidator {
  rules: DefaultRewardSegmentRule[];

  constructor(rules: DefaultRewardSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultRewardSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultRewardSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultRewardSegment[]): Map<string, string[]> {
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

export function defaultDefaultRewardSegmentValidator(): DefaultRewardSegmentValidator {
  return new DefaultRewardSegmentValidator(
    [
      new DefaultRewardSegmentRequiredTitleRule("default reward segment needs a value"),
      new DefaultRewardSegmentRequiredLocaleRule("default reward segment needs a value"),
      new DefaultRewardSegmentWindowDaysRangeRule(120, 120),
    ],
  );
}
