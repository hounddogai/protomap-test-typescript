import * as text from "../../../../kit/text.js";
import { BadgeReservation } from "./badge-reservation.js";

/** A rule a badge reservation must pass. Check returns its problems, or none. */
export interface BadgeReservationRule {
  check(item: BadgeReservation): string[];
}

export class BadgeReservationAllowedCodeRule implements BadgeReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class BadgeReservationMarginRangeRule implements BadgeReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeReservation): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeReservationRequiredLabelRule implements BadgeReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeReservationLabelLengthRule implements BadgeReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeReservationMaximumRangeRule implements BadgeReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeReservation): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeReservationCodeLengthRule implements BadgeReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a badge reservation. */
export class BadgeReservationValidator {
  rules: BadgeReservationRule[];

  constructor(rules: BadgeReservationRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeReservation): string[] {
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

  requireValid(item: BadgeReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeReservation[]): Map<string, string[]> {
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

export function defaultBadgeReservationValidator(): BadgeReservationValidator {
  return new BadgeReservationValidator(
    [
      new BadgeReservationAllowedCodeRule(["rolling"]),
      new BadgeReservationMarginRangeRule(9.5, 2716.5),
      new BadgeReservationRequiredLabelRule("badge reservation needs this field"),
      new BadgeReservationLabelLengthRule(80),
      new BadgeReservationMaximumRangeRule(5.1, 3595.3),
      new BadgeReservationCodeLengthRule(16),
    ],
  );
}
