import * as text from "../../../../kit/text.js";
import { ManualPayoutReservation } from "./manual-payout-reservation.js";

/** A rule a manual payout reservation must pass. Check returns its problems, or none. */
export interface ManualPayoutReservationRule {
  check(item: ManualPayoutReservation): string[];
}

export class ManualPayoutReservationRequiredNameRule implements ManualPayoutReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPayoutReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPayoutReservationRequiredCodeRule implements ManualPayoutReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPayoutReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPayoutReservationSegmentLengthRule implements ManualPayoutReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPayoutReservation): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPayoutReservationReviewerLengthRule implements ManualPayoutReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPayoutReservation): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPayoutReservationAllowedCodeRule implements ManualPayoutReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPayoutReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class ManualPayoutReservationBatchSizeRangeRule implements ManualPayoutReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPayoutReservation): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual payout reservation. */
export class ManualPayoutReservationValidator {
  rules: ManualPayoutReservationRule[];

  constructor(rules: ManualPayoutReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPayoutReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPayoutReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPayoutReservation[]): Map<string, string[]> {
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

export function defaultManualPayoutReservationValidator(): ManualPayoutReservationValidator {
  return new ManualPayoutReservationValidator(
    [
      new ManualPayoutReservationRequiredNameRule("manual payout reservation needs an entry"),
      new ManualPayoutReservationRequiredCodeRule("manual payout reservation needs a value"),
      new ManualPayoutReservationSegmentLengthRule(86400),
      new ManualPayoutReservationReviewerLengthRule(64),
      new ManualPayoutReservationAllowedCodeRule([]),
      new ManualPayoutReservationBatchSizeRangeRule(120, 86400),
    ],
  );
}
