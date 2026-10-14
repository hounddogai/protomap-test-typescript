import { InsightAssignment } from "./insight-assignment.js";

/** A rule a insight assignment must pass. Check returns its problems, or none. */
export interface InsightAssignmentRule {
  check(item: InsightAssignment): string[];
}

export class InsightAssignmentSequenceRangeRule implements InsightAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightAssignment): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightAssignmentRequiredTitleRule implements InsightAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InsightAssignmentStartsAtRangeRule implements InsightAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightAssignment): string[] {
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

export class InsightAssignmentCodeLengthRule implements InsightAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightAssignmentPriorityRangeRule implements InsightAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightAssignment): string[] {
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

/** Runs every rule of a insight assignment. */
export class InsightAssignmentValidator {
  rules: InsightAssignmentRule[];

  constructor(rules: InsightAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: InsightAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightAssignment[]): Map<string, string[]> {
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

export function defaultInsightAssignmentValidator(): InsightAssignmentValidator {
  return new InsightAssignmentValidator(
    [
      new InsightAssignmentSequenceRangeRule(86400, 86400),
      new InsightAssignmentRequiredTitleRule("insight assignment needs a value"),
      new InsightAssignmentStartsAtRangeRule(32, 86400),
      new InsightAssignmentCodeLengthRule(16),
      new InsightAssignmentPriorityRangeRule(32, 32),
    ],
  );
}
