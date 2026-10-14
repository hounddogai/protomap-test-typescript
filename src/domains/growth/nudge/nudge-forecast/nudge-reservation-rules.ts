import * as text from "../../../../kit/text.js";
import { NudgeReservation } from "./nudge-reservation.js";

/** A rule a nudge reservation must pass. Check returns its problems, or none. */
export interface NudgeReservationRule {
  check(item: NudgeReservation): string[];
}

export class NudgeReservationLocaleLengthRule implements NudgeReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeReservation): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeReservationAllowedLocaleRule implements NudgeReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is below minimum`];
    return [];
  }
}

export class NudgeReservationCodeLengthRule implements NudgeReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeReservationApprovedGuardRule implements NudgeReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: NudgeReservation): string[] {
    if (item.approved && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class NudgeReservationTitleLengthRule implements NudgeReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeReservationRequiredLocaleRule implements NudgeReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeReservation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge reservation. */
export class NudgeReservationValidator {
  rules: NudgeReservationRule[];

  constructor(rules: NudgeReservationRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeReservation): string[] {
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

  requireValid(item: NudgeReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeReservation[]): Map<string, string[]> {
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

export function defaultNudgeReservationValidator(): NudgeReservationValidator {
  return new NudgeReservationValidator(
    [
      new NudgeReservationLocaleLengthRule(255),
      new NudgeReservationAllowedLocaleRule(["adaptive", "global", "default"]),
      new NudgeReservationCodeLengthRule(16),
      new NudgeReservationApprovedGuardRule(5.9),
      new NudgeReservationTitleLengthRule(64),
      new NudgeReservationRequiredLocaleRule("nudge reservation needs an entry"),
    ],
  );
}
