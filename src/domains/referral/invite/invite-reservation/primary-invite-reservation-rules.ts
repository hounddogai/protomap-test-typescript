import { PrimaryInviteReservation } from "./primary-invite-reservation.js";

/** A rule a primary invite reservation must pass. Check returns its problems, or none. */
export interface PrimaryInviteReservationRule {
  check(item: PrimaryInviteReservation): string[];
}

export class PrimaryInviteReservationScoreRangeRule implements PrimaryInviteReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryInviteReservation): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryInviteReservationCodeLengthRule implements PrimaryInviteReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInviteReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryInviteReservationCodePrefixRule implements PrimaryInviteReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryInviteReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryInviteReservationRateRangeRule implements PrimaryInviteReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryInviteReservation): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryInviteReservationChecksumLengthRule implements PrimaryInviteReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryInviteReservation): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary invite reservation. */
export class PrimaryInviteReservationValidator {
  rules: PrimaryInviteReservationRule[];

  constructor(rules: PrimaryInviteReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryInviteReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryInviteReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryInviteReservation[]): Map<string, string[]> {
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

export function defaultPrimaryInviteReservationValidator(): PrimaryInviteReservationValidator {
  return new PrimaryInviteReservationValidator(
    [
      new PrimaryInviteReservationScoreRangeRule(8.5, 4592.9),
      new PrimaryInviteReservationCodeLengthRule(120),
      new PrimaryInviteReservationCodePrefixRule("ACM"),
      new PrimaryInviteReservationRateRangeRule(6.4, 4694.1),
      new PrimaryInviteReservationChecksumLengthRule(255),
    ],
  );
}
