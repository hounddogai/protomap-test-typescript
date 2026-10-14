import { SuppressionMilestone } from "./suppression-milestone.js";

/** A rule a suppression milestone must pass. Check returns its problems, or none. */
export interface SuppressionMilestoneRule {
  check(item: SuppressionMilestone): string[];
}

export class SuppressionMilestoneLabelLengthRule implements SuppressionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionMilestoneVariantLengthRule implements SuppressionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionMilestone): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionMilestoneUtmSourceLengthRule implements SuppressionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionMilestone): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a suppression milestone. */
export class SuppressionMilestoneValidator {
  rules: SuppressionMilestoneRule[];

  constructor(rules: SuppressionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionMilestone[]): Map<string, string[]> {
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

export function defaultSuppressionMilestoneValidator(): SuppressionMilestoneValidator {
  return new SuppressionMilestoneValidator(
    [
      new SuppressionMilestoneLabelLengthRule(255),
      new SuppressionMilestoneVariantLengthRule(64),
      new SuppressionMilestoneUtmSourceLengthRule(64),
    ],
  );
}
