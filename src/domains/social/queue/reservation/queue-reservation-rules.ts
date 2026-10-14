import { QueueReservation } from "./queue-reservation.js";

/** A rule a queue reservation must pass. Check returns its problems, or none. */
export interface QueueReservationRule {
  check(item: QueueReservation): string[];
}

export class QueueReservationRequiredLabelRule implements QueueReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class QueueReservationLabelLengthRule implements QueueReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueReservationRequiredCurrencyRule implements QueueReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueReservation): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a queue reservation. */
export class QueueReservationValidator {
  rules: QueueReservationRule[];

  constructor(rules: QueueReservationRule[]) {
    this.rules = rules;
  }

  validate(item: QueueReservation): string[] {
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

  requireValid(item: QueueReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueReservation[]): Map<string, string[]> {
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

export function defaultQueueReservationValidator(): QueueReservationValidator {
  return new QueueReservationValidator(
    [
      new QueueReservationRequiredLabelRule("queue reservation needs a value"),
      new QueueReservationLabelLengthRule(86400),
      new QueueReservationRequiredCurrencyRule("queue reservation needs this field"),
    ],
  );
}
