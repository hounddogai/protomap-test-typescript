import * as text from "../../../../kit/text.js";
import { RetentionReservation } from "./retention-reservation.js";

/** A rule a retention reservation must pass. Check returns its problems, or none. */
export interface RetentionReservationRule {
  check(item: RetentionReservation): string[];
}

export class RetentionReservationCodePrefixRule implements RetentionReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RetentionReservationApprovedGuardRule implements RetentionReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RetentionReservation): string[] {
    if (item.approved && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class RetentionReservationNameLengthRule implements RetentionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionReservationScoreRangeRule implements RetentionReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionReservation): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionReservationAllowedCodeRule implements RetentionReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

/** Runs every rule of a retention reservation. */
export class RetentionReservationValidator {
  rules: RetentionReservationRule[];

  constructor(rules: RetentionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionReservation): string[] {
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

  requireValid(item: RetentionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionReservation[]): Map<string, string[]> {
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

export function defaultRetentionReservationValidator(): RetentionReservationValidator {
  return new RetentionReservationValidator(
    [
      new RetentionReservationCodePrefixRule("Q"),
      new RetentionReservationApprovedGuardRule(5.3),
      new RetentionReservationNameLengthRule(120),
      new RetentionReservationScoreRangeRule(1.3, 3742.3),
      new RetentionReservationAllowedCodeRule(["adaptive", "capped"]),
    ],
  );
}
