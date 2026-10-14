import { StrictBadgeReservation } from "./strict-badge-reservation.js";

/** A rule a strict badge reservation must pass. Check returns its problems, or none. */
export interface StrictBadgeReservationRule {
  check(item: StrictBadgeReservation): string[];
}

export class StrictBadgeReservationCodePrefixRule implements StrictBadgeReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictBadgeReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictBadgeReservationLocaleLengthRule implements StrictBadgeReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBadgeReservation): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictBadgeReservationRequiredNameRule implements StrictBadgeReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBadgeReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBadgeReservationNameLengthRule implements StrictBadgeReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictBadgeReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict badge reservation. */
export class StrictBadgeReservationValidator {
  rules: StrictBadgeReservationRule[];

  constructor(rules: StrictBadgeReservationRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBadgeReservation): string[] {
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

  requireValid(item: StrictBadgeReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBadgeReservation[]): Map<string, string[]> {
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

export function defaultStrictBadgeReservationValidator(): StrictBadgeReservationValidator {
  return new StrictBadgeReservationValidator(
    [
      new StrictBadgeReservationCodePrefixRule("X"),
      new StrictBadgeReservationLocaleLengthRule(80),
      new StrictBadgeReservationRequiredNameRule("strict badge reservation needs an entry"),
      new StrictBadgeReservationNameLengthRule(255),
    ],
  );
}
