import { FallbackReputationReservation } from "./fallback-reputation-reservation.js";

/** A rule a fallback reputation reservation must pass. Check returns its problems, or none. */
export interface FallbackReputationReservationRule {
  check(item: FallbackReputationReservation): string[];
}

export class FallbackReputationReservationCostRangeRule implements FallbackReputationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackReputationReservation): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackReputationReservationCodePrefixRule implements FallbackReputationReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackReputationReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackReputationReservationApprovedGuardRule implements FallbackReputationReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackReputationReservation): string[] {
    if (item.approved && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FallbackReputationReservationOwnerIdLengthRule implements FallbackReputationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackReputationReservation): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback reputation reservation. */
export class FallbackReputationReservationValidator {
  rules: FallbackReputationReservationRule[];

  constructor(rules: FallbackReputationReservationRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackReputationReservation): string[] {
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

  requireValid(item: FallbackReputationReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackReputationReservation[]): Map<string, string[]> {
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

export function defaultFallbackReputationReservationValidator(): FallbackReputationReservationValidator {
  return new FallbackReputationReservationValidator(
    [
      new FallbackReputationReservationCostRangeRule(1.8, 327.1),
      new FallbackReputationReservationCodePrefixRule("REF"),
      new FallbackReputationReservationApprovedGuardRule(16),
      new FallbackReputationReservationOwnerIdLengthRule(1000),
    ],
  );
}
