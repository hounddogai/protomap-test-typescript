import * as text from "../../../../kit/text.js";
import { ManualSubscriptionReservation } from "./manual-subscription-reservation.js";

/** A rule a manual subscription reservation must pass. Check returns its problems, or none. */
export interface ManualSubscriptionReservationRule {
  check(item: ManualSubscriptionReservation): string[];
}

export class ManualSubscriptionReservationCodePrefixRule implements ManualSubscriptionReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualSubscriptionReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualSubscriptionReservationAllowedCodeRule implements ManualSubscriptionReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualSubscriptionReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class ManualSubscriptionReservationTitleLengthRule implements ManualSubscriptionReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualSubscriptionReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual subscription reservation. */
export class ManualSubscriptionReservationValidator {
  rules: ManualSubscriptionReservationRule[];

  constructor(rules: ManualSubscriptionReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSubscriptionReservation): string[] {
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

  requireValid(item: ManualSubscriptionReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSubscriptionReservation[]): Map<string, string[]> {
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

export function defaultManualSubscriptionReservationValidator(): ManualSubscriptionReservationValidator {
  return new ManualSubscriptionReservationValidator(
    [
      new ManualSubscriptionReservationCodePrefixRule("REF"),
      new ManualSubscriptionReservationAllowedCodeRule(["batched", "rolling"]),
      new ManualSubscriptionReservationTitleLengthRule(120),
    ],
  );
}
