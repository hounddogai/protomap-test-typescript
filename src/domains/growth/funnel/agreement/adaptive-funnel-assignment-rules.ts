import { AdaptiveFunnelAssignment } from "./adaptive-funnel-assignment.js";

/** A rule a adaptive funnel assignment must pass. Check returns its problems, or none. */
export interface AdaptiveFunnelAssignmentRule {
  check(item: AdaptiveFunnelAssignment): string[];
}

export class AdaptiveFunnelAssignmentRequiredUnitRule implements AdaptiveFunnelAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFunnelAssignment): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFunnelAssignmentReviewerLengthRule implements AdaptiveFunnelAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFunnelAssignment): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFunnelAssignmentRequiredCodeRule implements AdaptiveFunnelAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFunnelAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive funnel assignment. */
export class AdaptiveFunnelAssignmentValidator {
  rules: AdaptiveFunnelAssignmentRule[];

  constructor(rules: AdaptiveFunnelAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFunnelAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFunnelAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFunnelAssignment[]): Map<string, string[]> {
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

export function defaultAdaptiveFunnelAssignmentValidator(): AdaptiveFunnelAssignmentValidator {
  return new AdaptiveFunnelAssignmentValidator(
    [
      new AdaptiveFunnelAssignmentRequiredUnitRule("adaptive funnel assignment needs a value"),
      new AdaptiveFunnelAssignmentReviewerLengthRule(16),
      new AdaptiveFunnelAssignmentRequiredCodeRule("adaptive funnel assignment needs this field"),
    ],
  );
}
