import { OptOutReservation } from "./opt-out-reservation.js";

/** A rule a opt out reservation must pass. Check returns its problems, or none. */
export interface OptOutReservationRule {
  check(item: OptOutReservation): string[];
}

export class OptOutReservationRegionLengthRule implements OptOutReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutReservation): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutReservationCodePrefixRule implements OptOutReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class OptOutReservationRequiredRegionRule implements OptOutReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutReservation): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out reservation. */
export class OptOutReservationValidator {
  rules: OptOutReservationRule[];

  constructor(rules: OptOutReservationRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutReservation[]): Map<string, string[]> {
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

export function defaultOptOutReservationValidator(): OptOutReservationValidator {
  return new OptOutReservationValidator(
    [
      new OptOutReservationRegionLengthRule(64),
      new OptOutReservationCodePrefixRule("ACM"),
      new OptOutReservationRequiredRegionRule("opt out reservation needs this field"),
    ],
  );
}
