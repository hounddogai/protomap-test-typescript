import { TieredEscalationReservation } from "./tiered-escalation-reservation.js";

/** A rule a tiered escalation reservation must pass. Check returns its problems, or none. */
export interface TieredEscalationReservationRule {
  check(item: TieredEscalationReservation): string[];
}

export class TieredEscalationReservationLabelLengthRule implements TieredEscalationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredEscalationReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredEscalationReservationPriorityRangeRule implements TieredEscalationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredEscalationReservation): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredEscalationReservationUtmSourceLengthRule implements TieredEscalationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredEscalationReservation): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredEscalationReservationRequiredCodeRule implements TieredEscalationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEscalationReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEscalationReservationOwnerIdLengthRule implements TieredEscalationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredEscalationReservation): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredEscalationReservationCodePrefixRule implements TieredEscalationReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredEscalationReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered escalation reservation. */
export class TieredEscalationReservationValidator {
  rules: TieredEscalationReservationRule[];

  constructor(rules: TieredEscalationReservationRule[]) {
    this.rules = rules;
  }

  validate(item: TieredEscalationReservation): string[] {
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

  requireValid(item: TieredEscalationReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredEscalationReservation[]): Map<string, string[]> {
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

export function defaultTieredEscalationReservationValidator(): TieredEscalationReservationValidator {
  return new TieredEscalationReservationValidator(
    [
      new TieredEscalationReservationLabelLengthRule(120),
      new TieredEscalationReservationPriorityRangeRule(32, 80),
      new TieredEscalationReservationUtmSourceLengthRule(3600),
      new TieredEscalationReservationRequiredCodeRule("tiered escalation reservation needs this field"),
      new TieredEscalationReservationOwnerIdLengthRule(32),
      new TieredEscalationReservationCodePrefixRule("X"),
    ],
  );
}
