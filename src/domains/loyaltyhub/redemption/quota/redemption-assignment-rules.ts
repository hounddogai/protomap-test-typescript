import { RedemptionAssignment } from "./redemption-assignment.js";

/** A rule a redemption assignment must pass. Check returns its problems, or none. */
export interface RedemptionAssignmentRule {
  check(item: RedemptionAssignment): string[];
}

export class RedemptionAssignmentRequiredCodeRule implements RedemptionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionAssignmentAudienceIdLengthRule implements RedemptionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionAssignment): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionAssignmentReviewerLengthRule implements RedemptionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionAssignment): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionAssignmentFloorValueRangeRule implements RedemptionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionAssignment): string[] {
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

export class RedemptionAssignmentRequiredAudienceIdRule implements RedemptionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionAssignment): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a redemption assignment. */
export class RedemptionAssignmentValidator {
  rules: RedemptionAssignmentRule[];

  constructor(rules: RedemptionAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionAssignment[]): Map<string, string[]> {
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

export function defaultRedemptionAssignmentValidator(): RedemptionAssignmentValidator {
  return new RedemptionAssignmentValidator(
    [
      new RedemptionAssignmentRequiredCodeRule("redemption assignment needs this field"),
      new RedemptionAssignmentAudienceIdLengthRule(120),
      new RedemptionAssignmentReviewerLengthRule(1000),
      new RedemptionAssignmentFloorValueRangeRule(7.9, 2905.6),
      new RedemptionAssignmentRequiredAudienceIdRule("redemption assignment needs an entry"),
    ],
  );
}
