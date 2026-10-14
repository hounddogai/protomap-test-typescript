import * as text from "../../../../kit/text.js";
import { SubscriptionReservation } from "./subscription-reservation.js";

/** A rule a subscription reservation must pass. Check returns its problems, or none. */
export interface SubscriptionReservationRule {
  check(item: SubscriptionReservation): string[];
}

export class SubscriptionReservationAllowedSourceRule implements SubscriptionReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is duplicated`];
    return [];
  }
}

export class SubscriptionReservationCodePrefixRule implements SubscriptionReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionReservationRequiredNameRule implements SubscriptionReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a subscription reservation. */
export class SubscriptionReservationValidator {
  rules: SubscriptionReservationRule[];

  constructor(rules: SubscriptionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionReservation): string[] {
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

  requireValid(item: SubscriptionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionReservation[]): Map<string, string[]> {
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

export function defaultSubscriptionReservationValidator(): SubscriptionReservationValidator {
  return new SubscriptionReservationValidator(
    [
      new SubscriptionReservationAllowedSourceRule(["primary"]),
      new SubscriptionReservationCodePrefixRule("X"),
      new SubscriptionReservationRequiredNameRule("subscription reservation needs this field"),
    ],
  );
}
