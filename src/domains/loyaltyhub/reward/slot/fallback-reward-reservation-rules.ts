import * as text from "../../../../kit/text.js";
import { FallbackRewardReservation } from "./fallback-reward-reservation.js";

/** A rule a fallback reward reservation must pass. Check returns its problems, or none. */
export interface FallbackRewardReservationRule {
  check(item: FallbackRewardReservation): string[];
}

export class FallbackRewardReservationRequiredExternalRefRule implements FallbackRewardReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardReservation): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackRewardReservationAllowedCodeRule implements FallbackRewardReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackRewardReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class FallbackRewardReservationExpiresAtRangeRule implements FallbackRewardReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackRewardReservation): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackRewardReservationRequiredTitleRule implements FallbackRewardReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackRewardReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback reward reservation. */
export class FallbackRewardReservationValidator {
  rules: FallbackRewardReservationRule[];

  constructor(rules: FallbackRewardReservationRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackRewardReservation): string[] {
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

  requireValid(item: FallbackRewardReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackRewardReservation[]): Map<string, string[]> {
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

export function defaultFallbackRewardReservationValidator(): FallbackRewardReservationValidator {
  return new FallbackRewardReservationValidator(
    [
      new FallbackRewardReservationRequiredExternalRefRule("fallback reward reservation needs an entry"),
      new FallbackRewardReservationAllowedCodeRule(["capped"]),
      new FallbackRewardReservationExpiresAtRangeRule(32, 120),
      new FallbackRewardReservationRequiredTitleRule("fallback reward reservation needs this field"),
    ],
  );
}
