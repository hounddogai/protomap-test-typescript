import { PrimaryEscalationReservation } from "./primary-escalation-reservation.js";

/** A rule a primary escalation reservation must pass. Check returns its problems, or none. */
export interface PrimaryEscalationReservationRule {
  check(item: PrimaryEscalationReservation): string[];
}

export class PrimaryEscalationReservationAttemptsRangeRule implements PrimaryEscalationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryEscalationReservation): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryEscalationReservationClicksRangeRule implements PrimaryEscalationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryEscalationReservation): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryEscalationReservationCodePrefixRule implements PrimaryEscalationReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryEscalationReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryEscalationReservationVisibleGuardRule implements PrimaryEscalationReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryEscalationReservation): string[] {
    if (item.visible && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a primary escalation reservation. */
export class PrimaryEscalationReservationValidator {
  rules: PrimaryEscalationReservationRule[];

  constructor(rules: PrimaryEscalationReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryEscalationReservation): string[] {
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

  requireValid(item: PrimaryEscalationReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryEscalationReservation[]): Map<string, string[]> {
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

export function defaultPrimaryEscalationReservationValidator(): PrimaryEscalationReservationValidator {
  return new PrimaryEscalationReservationValidator(
    [
      new PrimaryEscalationReservationAttemptsRangeRule(80, 120),
      new PrimaryEscalationReservationClicksRangeRule(3600, 86400),
      new PrimaryEscalationReservationCodePrefixRule("Q"),
      new PrimaryEscalationReservationVisibleGuardRule(8),
    ],
  );
}
