import { ReplyReservation } from "./reply-reservation.js";

/** A rule a reply reservation must pass. Check returns its problems, or none. */
export interface ReplyReservationRule {
  check(item: ReplyReservation): string[];
}

export class ReplyReservationRequiredCodeRule implements ReplyReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyReservationCountryLengthRule implements ReplyReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyReservation): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyReservationBatchSizeRangeRule implements ReplyReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyReservation): string[] {
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

/** Runs every rule of a reply reservation. */
export class ReplyReservationValidator {
  rules: ReplyReservationRule[];

  constructor(rules: ReplyReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyReservation): string[] {
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

  requireValid(item: ReplyReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyReservation[]): Map<string, string[]> {
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

export function defaultReplyReservationValidator(): ReplyReservationValidator {
  return new ReplyReservationValidator(
    [
      new ReplyReservationRequiredCodeRule("reply reservation needs an entry"),
      new ReplyReservationCountryLengthRule(64),
      new ReplyReservationBatchSizeRangeRule(64, 86400),
    ],
  );
}
