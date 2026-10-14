import { StrictBounceReservation } from "./strict-bounce-reservation.js";

/** A rule a strict bounce reservation must pass. Check returns its problems, or none. */
export interface StrictBounceReservationRule {
  check(item: StrictBounceReservation): string[];
}

export class StrictBounceReservationChannelLengthRule implements StrictBounceReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBounceReservation): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBounceReservationRequiredTitleRule implements StrictBounceReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBounceReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBounceReservationTitleLengthRule implements StrictBounceReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBounceReservation): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBounceReservationRequiredCodeRule implements StrictBounceReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBounceReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBounceReservationLabelLengthRule implements StrictBounceReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBounceReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBounceReservationCodeLengthRule implements StrictBounceReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBounceReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict bounce reservation. */
export class StrictBounceReservationValidator {
  rules: StrictBounceReservationRule[];

  constructor(rules: StrictBounceReservationRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBounceReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictBounceReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBounceReservation[]): Map<string, string[]> {
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

export function defaultStrictBounceReservationValidator(): StrictBounceReservationValidator {
  return new StrictBounceReservationValidator(
    [
      new StrictBounceReservationChannelLengthRule(64),
      new StrictBounceReservationRequiredTitleRule("strict bounce reservation needs this field"),
      new StrictBounceReservationTitleLengthRule(86400),
      new StrictBounceReservationRequiredCodeRule("strict bounce reservation needs this field"),
      new StrictBounceReservationLabelLengthRule(64),
      new StrictBounceReservationCodeLengthRule(32),
    ],
  );
}
