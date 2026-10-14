import { ManualPacingReservation } from "./manual-pacing-reservation.js";

/** A rule a manual pacing reservation must pass. Check returns its problems, or none. */
export interface ManualPacingReservationRule {
  check(item: ManualPacingReservation): string[];
}

export class ManualPacingReservationSourceLengthRule implements ManualPacingReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPacingReservation): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPacingReservationRequiredSourceRule implements ManualPacingReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPacingReservation): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPacingReservationRequiredTimezoneRule implements ManualPacingReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPacingReservation): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPacingReservationCodePrefixRule implements ManualPacingReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualPacingReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual pacing reservation. */
export class ManualPacingReservationValidator {
  rules: ManualPacingReservationRule[];

  constructor(rules: ManualPacingReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPacingReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPacingReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPacingReservation[]): Map<string, string[]> {
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

export function defaultManualPacingReservationValidator(): ManualPacingReservationValidator {
  return new ManualPacingReservationValidator(
    [
      new ManualPacingReservationSourceLengthRule(120),
      new ManualPacingReservationRequiredSourceRule("manual pacing reservation needs this field"),
      new ManualPacingReservationRequiredTimezoneRule("manual pacing reservation needs a value"),
      new ManualPacingReservationCodePrefixRule("X"),
    ],
  );
}
