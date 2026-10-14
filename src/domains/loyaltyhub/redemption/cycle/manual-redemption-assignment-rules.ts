import { ManualRedemptionAssignment } from "./manual-redemption-assignment.js";

/** A rule a manual redemption assignment must pass. Check returns its problems, or none. */
export interface ManualRedemptionAssignmentRule {
  check(item: ManualRedemptionAssignment): string[];
}

export class ManualRedemptionAssignmentRequiredLabelRule implements ManualRedemptionAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRedemptionAssignment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRedemptionAssignmentVersionRangeRule implements ManualRedemptionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRedemptionAssignment): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualRedemptionAssignmentCodeLengthRule implements ManualRedemptionAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRedemptionAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRedemptionAssignmentWindowDaysRangeRule implements ManualRedemptionAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRedemptionAssignment): string[] {
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

/** Runs every rule of a manual redemption assignment. */
export class ManualRedemptionAssignmentValidator {
  rules: ManualRedemptionAssignmentRule[];

  constructor(rules: ManualRedemptionAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRedemptionAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: ManualRedemptionAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRedemptionAssignment[]): Map<string, string[]> {
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

export function defaultManualRedemptionAssignmentValidator(): ManualRedemptionAssignmentValidator {
  return new ManualRedemptionAssignmentValidator(
    [
      new ManualRedemptionAssignmentRequiredLabelRule("manual redemption assignment needs a value"),
      new ManualRedemptionAssignmentVersionRangeRule(32, 32),
      new ManualRedemptionAssignmentCodeLengthRule(120),
      new ManualRedemptionAssignmentWindowDaysRangeRule(255, 86400),
    ],
  );
}
