import { InsightProfile } from "./insight-profile.js";

/** A rule a insight profile must pass. Check returns its problems, or none. */
export interface InsightProfileRule {
  check(item: InsightProfile): string[];
}

export class InsightProfileTimezoneLengthRule implements InsightProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightProfile): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightProfilePriorityRangeRule implements InsightProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightProfile): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightProfileSegmentLengthRule implements InsightProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightProfile): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightProfileScoreRangeRule implements InsightProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightProfile): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightProfileRequiredCodeRule implements InsightProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight profile. */
export class InsightProfileValidator {
  rules: InsightProfileRule[];

  constructor(rules: InsightProfileRule[]) {
    this.rules = rules;
  }

  validate(item: InsightProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightProfile[]): Map<string, string[]> {
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

export function defaultInsightProfileValidator(): InsightProfileValidator {
  return new InsightProfileValidator(
    [
      new InsightProfileTimezoneLengthRule(64),
      new InsightProfilePriorityRangeRule(16, 32),
      new InsightProfileSegmentLengthRule(32),
      new InsightProfileScoreRangeRule(8.5, 4480.2),
      new InsightProfileRequiredCodeRule("insight profile needs an entry"),
    ],
  );
}
