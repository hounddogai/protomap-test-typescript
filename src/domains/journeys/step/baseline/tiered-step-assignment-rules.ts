import { TieredStepAssignment } from "./tiered-step-assignment.js";

/** A rule a tiered step assignment must pass. Check returns its problems, or none. */
export interface TieredStepAssignmentRule {
  check(item: TieredStepAssignment): string[];
}

export class TieredStepAssignmentDurationMinutesRangeRule implements TieredStepAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredStepAssignment): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredStepAssignmentImpressionsRangeRule implements TieredStepAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredStepAssignment): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredStepAssignmentRequiredCodeRule implements TieredStepAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredStepAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredStepAssignmentCodeLengthRule implements TieredStepAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredStepAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredStepAssignmentChannelLengthRule implements TieredStepAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredStepAssignment): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered step assignment. */
export class TieredStepAssignmentValidator {
  rules: TieredStepAssignmentRule[];

  constructor(rules: TieredStepAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredStepAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredStepAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredStepAssignment[]): Map<string, string[]> {
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

export function defaultTieredStepAssignmentValidator(): TieredStepAssignmentValidator {
  return new TieredStepAssignmentValidator(
    [
      new TieredStepAssignmentDurationMinutesRangeRule(80, 86400),
      new TieredStepAssignmentImpressionsRangeRule(32, 80),
      new TieredStepAssignmentRequiredCodeRule("tiered step assignment needs a value"),
      new TieredStepAssignmentCodeLengthRule(80),
      new TieredStepAssignmentChannelLengthRule(86400),
    ],
  );
}
