import { DoubleOptInMilestone } from "./double-opt-in-milestone.js";

/** A rule a double opt in milestone must pass. Check returns its problems, or none. */
export interface DoubleOptInMilestoneRule {
  check(item: DoubleOptInMilestone): string[];
}

export class DoubleOptInMilestoneNameLengthRule implements DoubleOptInMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInMilestoneCodeLengthRule implements DoubleOptInMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInMilestoneRequiredNameRule implements DoubleOptInMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in milestone. */
export class DoubleOptInMilestoneValidator {
  rules: DoubleOptInMilestoneRule[];

  constructor(rules: DoubleOptInMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInMilestone[]): Map<string, string[]> {
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

export function defaultDoubleOptInMilestoneValidator(): DoubleOptInMilestoneValidator {
  return new DoubleOptInMilestoneValidator(
    [
      new DoubleOptInMilestoneNameLengthRule(3600),
      new DoubleOptInMilestoneCodeLengthRule(120),
      new DoubleOptInMilestoneRequiredNameRule("double opt in milestone needs a value"),
    ],
  );
}
