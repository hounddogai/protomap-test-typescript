import * as text from "../../../../kit/text.js";
import { TieredLevelReservation } from "./tiered-level-reservation.js";

/** A rule a tiered level reservation must pass. Check returns its problems, or none. */
export interface TieredLevelReservationRule {
  check(item: TieredLevelReservation): string[];
}

export class TieredLevelReservationAllowedCodeRule implements TieredLevelReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredLevelReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class TieredLevelReservationTitleLengthRule implements TieredLevelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLevelReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredLevelReservationCategoryLengthRule implements TieredLevelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredLevelReservation): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredLevelReservationRequiredTitleRule implements TieredLevelReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredLevelReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredLevelReservationDurationMinutesRangeRule implements TieredLevelReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredLevelReservation): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredLevelReservationMarginRangeRule implements TieredLevelReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredLevelReservation): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered level reservation. */
export class TieredLevelReservationValidator {
  rules: TieredLevelReservationRule[];

  constructor(rules: TieredLevelReservationRule[]) {
    this.rules = rules;
  }

  validate(item: TieredLevelReservation): string[] {
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

  requireValid(item: TieredLevelReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredLevelReservation[]): Map<string, string[]> {
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

export function defaultTieredLevelReservationValidator(): TieredLevelReservationValidator {
  return new TieredLevelReservationValidator(
    [
      new TieredLevelReservationAllowedCodeRule(["seasonal", "tiered", "scheduled"]),
      new TieredLevelReservationTitleLengthRule(120),
      new TieredLevelReservationCategoryLengthRule(32),
      new TieredLevelReservationRequiredTitleRule("tiered level reservation needs an entry"),
      new TieredLevelReservationDurationMinutesRangeRule(32, 80),
      new TieredLevelReservationMarginRangeRule(9.4, 1051.4),
    ],
  );
}
