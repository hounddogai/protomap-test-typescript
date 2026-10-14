import * as text from "../../../../kit/text.js";
import { RollingMacroAssignment } from "./rolling-macro-assignment.js";

/** A rule a rolling macro assignment must pass. Check returns its problems, or none. */
export interface RollingMacroAssignmentRule {
  check(item: RollingMacroAssignment): string[];
}

export class RollingMacroAssignmentCapacityRangeRule implements RollingMacroAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingMacroAssignment): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingMacroAssignmentRequiredChannelRule implements RollingMacroAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingMacroAssignment): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class RollingMacroAssignmentNameLengthRule implements RollingMacroAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingMacroAssignment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingMacroAssignmentRevisionRangeRule implements RollingMacroAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingMacroAssignment): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingMacroAssignmentAllowedLocaleRule implements RollingMacroAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingMacroAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is unknown`];
    return [];
  }
}

export class RollingMacroAssignmentRequiredNameRule implements RollingMacroAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingMacroAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling macro assignment. */
export class RollingMacroAssignmentValidator {
  rules: RollingMacroAssignmentRule[];

  constructor(rules: RollingMacroAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingMacroAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingMacroAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingMacroAssignment[]): Map<string, string[]> {
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

export function defaultRollingMacroAssignmentValidator(): RollingMacroAssignmentValidator {
  return new RollingMacroAssignmentValidator(
    [
      new RollingMacroAssignmentCapacityRangeRule(80, 1000),
      new RollingMacroAssignmentRequiredChannelRule("rolling macro assignment needs an entry"),
      new RollingMacroAssignmentNameLengthRule(80),
      new RollingMacroAssignmentRevisionRangeRule(32, 120),
      new RollingMacroAssignmentAllowedLocaleRule([]),
      new RollingMacroAssignmentRequiredNameRule("rolling macro assignment needs this field"),
    ],
  );
}
