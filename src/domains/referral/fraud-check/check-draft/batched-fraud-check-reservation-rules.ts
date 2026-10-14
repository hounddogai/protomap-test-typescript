import * as text from "../../../../kit/text.js";
import { BatchedFraudCheckReservation } from "./batched-fraud-check-reservation.js";

/** A rule a batched fraud check reservation must pass. Check returns its problems, or none. */
export interface BatchedFraudCheckReservationRule {
  check(item: BatchedFraudCheckReservation): string[];
}

export class BatchedFraudCheckReservationCodePrefixRule implements BatchedFraudCheckReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedFraudCheckReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedFraudCheckReservationAllowedCodeRule implements BatchedFraudCheckReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedFraudCheckReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class BatchedFraudCheckReservationSendAtRangeRule implements BatchedFraudCheckReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedFraudCheckReservation): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedFraudCheckReservationRequiredTitleRule implements BatchedFraudCheckReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedFraudCheckReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched fraud check reservation. */
export class BatchedFraudCheckReservationValidator {
  rules: BatchedFraudCheckReservationRule[];

  constructor(rules: BatchedFraudCheckReservationRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedFraudCheckReservation): string[] {
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

  requireValid(item: BatchedFraudCheckReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedFraudCheckReservation[]): Map<string, string[]> {
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

export function defaultBatchedFraudCheckReservationValidator(): BatchedFraudCheckReservationValidator {
  return new BatchedFraudCheckReservationValidator(
    [
      new BatchedFraudCheckReservationCodePrefixRule("OPS"),
      new BatchedFraudCheckReservationAllowedCodeRule(["regional", "regional"]),
      new BatchedFraudCheckReservationSendAtRangeRule(80, 1000),
      new BatchedFraudCheckReservationRequiredTitleRule("batched fraud check reservation needs a value"),
    ],
  );
}
