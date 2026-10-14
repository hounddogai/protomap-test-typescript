import { ExitRuleSegment } from "./exit-rule-segment.js";

/** A rule a exit rule segment must pass. Check returns its problems, or none. */
export interface ExitRuleSegmentRule {
  check(item: ExitRuleSegment): string[];
}

export class ExitRuleSegmentCodeLengthRule implements ExitRuleSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleSegmentRequiredCodeRule implements ExitRuleSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleSegmentCeilingRangeRule implements ExitRuleSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleSegment): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a exit rule segment. */
export class ExitRuleSegmentValidator {
  rules: ExitRuleSegmentRule[];

  constructor(rules: ExitRuleSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleSegment[]): Map<string, string[]> {
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

export function defaultExitRuleSegmentValidator(): ExitRuleSegmentValidator {
  return new ExitRuleSegmentValidator(
    [
      new ExitRuleSegmentCodeLengthRule(120),
      new ExitRuleSegmentRequiredCodeRule("exit rule segment needs a value"),
      new ExitRuleSegmentCeilingRangeRule(4, 1001.1),
    ],
  );
}
