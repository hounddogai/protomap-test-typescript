import * as text from "../../../../kit/text.js";
import { ScheduledPayoutReservation } from "./scheduled-payout-reservation.js";

/** A rule a scheduled payout reservation must pass. Check returns its problems, or none. */
export interface ScheduledPayoutReservationRule {
  check(item: ScheduledPayoutReservation): string[];
}

export class ScheduledPayoutReservationRequiredCodeRule implements ScheduledPayoutReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPayoutReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPayoutReservationCodePrefixRule implements ScheduledPayoutReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPayoutReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledPayoutReservationChannelLengthRule implements ScheduledPayoutReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPayoutReservation): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPayoutReservationAllowedLabelRule implements ScheduledPayoutReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledPayoutReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

/** Runs every rule of a scheduled payout reservation. */
export class ScheduledPayoutReservationValidator {
  rules: ScheduledPayoutReservationRule[];

  constructor(rules: ScheduledPayoutReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPayoutReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPayoutReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPayoutReservation[]): Map<string, string[]> {
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

export function defaultScheduledPayoutReservationValidator(): ScheduledPayoutReservationValidator {
  return new ScheduledPayoutReservationValidator(
    [
      new ScheduledPayoutReservationRequiredCodeRule("scheduled payout reservation needs an entry"),
      new ScheduledPayoutReservationCodePrefixRule("X"),
      new ScheduledPayoutReservationChannelLengthRule(255),
      new ScheduledPayoutReservationAllowedLabelRule(["legacy", "weighted"]),
    ],
  );
}
