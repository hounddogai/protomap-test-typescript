import { PrimaryActivationReservation } from "./primary-activation-reservation.js";

/** A rule a primary activation reservation must pass. Check returns its problems, or none. */
export interface PrimaryActivationReservationRule {
  check(item: PrimaryActivationReservation): string[];
}

export class PrimaryActivationReservationRequiredCodeRule implements PrimaryActivationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryActivationReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryActivationReservationRequiredCohortRule implements PrimaryActivationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryActivationReservation): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryActivationReservationRequiredSourceRule implements PrimaryActivationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryActivationReservation): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryActivationReservationCohortLengthRule implements PrimaryActivationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryActivationReservation): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryActivationReservationSourceLengthRule implements PrimaryActivationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryActivationReservation): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryActivationReservationNameLengthRule implements PrimaryActivationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryActivationReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary activation reservation. */
export class PrimaryActivationReservationValidator {
  rules: PrimaryActivationReservationRule[];

  constructor(rules: PrimaryActivationReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryActivationReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryActivationReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryActivationReservation[]): Map<string, string[]> {
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

export function defaultPrimaryActivationReservationValidator(): PrimaryActivationReservationValidator {
  return new PrimaryActivationReservationValidator(
    [
      new PrimaryActivationReservationRequiredCodeRule("primary activation reservation needs this field"),
      new PrimaryActivationReservationRequiredCohortRule("primary activation reservation needs this field"),
      new PrimaryActivationReservationRequiredSourceRule("primary activation reservation needs a value"),
      new PrimaryActivationReservationCohortLengthRule(64),
      new PrimaryActivationReservationSourceLengthRule(80),
      new PrimaryActivationReservationNameLengthRule(16),
    ],
  );
}
