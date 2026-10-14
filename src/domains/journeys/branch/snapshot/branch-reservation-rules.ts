import * as text from "../../../../kit/text.js";
import { BranchReservation } from "./branch-reservation.js";

/** A rule a branch reservation must pass. Check returns its problems, or none. */
export interface BranchReservationRule {
  check(item: BranchReservation): string[];
}

export class BranchReservationRequiredCodeRule implements BranchReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchReservationEndsAtRangeRule implements BranchReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchReservation): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchReservationAllowedTitleRule implements BranchReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

export class BranchReservationCodeLengthRule implements BranchReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchReservationCodePrefixRule implements BranchReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchReservationUtmSourceLengthRule implements BranchReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchReservation): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a branch reservation. */
export class BranchReservationValidator {
  rules: BranchReservationRule[];

  constructor(rules: BranchReservationRule[]) {
    this.rules = rules;
  }

  validate(item: BranchReservation): string[] {
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

  requireValid(item: BranchReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchReservation[]): Map<string, string[]> {
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

export function defaultBranchReservationValidator(): BranchReservationValidator {
  return new BranchReservationValidator(
    [
      new BranchReservationRequiredCodeRule("branch reservation needs this field"),
      new BranchReservationEndsAtRangeRule(120, 120),
      new BranchReservationAllowedTitleRule([]),
      new BranchReservationCodeLengthRule(3600),
      new BranchReservationCodePrefixRule("OPS"),
      new BranchReservationUtmSourceLengthRule(64),
    ],
  );
}
