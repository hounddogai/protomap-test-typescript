import { PacingMilestone } from "./pacing-milestone.js";

/** A rule a pacing milestone must pass. Check returns its problems, or none. */
export interface PacingMilestoneRule {
  check(item: PacingMilestone): string[];
}

export class PacingMilestoneOwnerIdLengthRule implements PacingMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingMilestone): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingMilestoneCodeLengthRule implements PacingMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingMilestoneRateRangeRule implements PacingMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingMilestone): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingMilestoneRequiredNameRule implements PacingMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PacingMilestoneVariantLengthRule implements PacingMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingMilestone): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingMilestoneNameLengthRule implements PacingMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pacing milestone. */
export class PacingMilestoneValidator {
  rules: PacingMilestoneRule[];

  constructor(rules: PacingMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PacingMilestone): string[] {
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

  requireValid(item: PacingMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingMilestone[]): Map<string, string[]> {
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

export function defaultPacingMilestoneValidator(): PacingMilestoneValidator {
  return new PacingMilestoneValidator(
    [
      new PacingMilestoneOwnerIdLengthRule(64),
      new PacingMilestoneCodeLengthRule(86400),
      new PacingMilestoneRateRangeRule(1.5, 277.1),
      new PacingMilestoneRequiredNameRule("pacing milestone needs this field"),
      new PacingMilestoneVariantLengthRule(3600),
      new PacingMilestoneNameLengthRule(16),
    ],
  );
}
