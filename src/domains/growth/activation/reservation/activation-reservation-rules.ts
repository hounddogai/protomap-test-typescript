import * as text from "../../../../kit/text.js";
import { ActivationReservation } from "./activation-reservation.js";

/** A rule a activation reservation must pass. Check returns its problems, or none. */
export interface ActivationReservationRule {
  check(item: ActivationReservation): string[];
}

export class ActivationReservationRequiredTitleRule implements ActivationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationReservationAttemptsRangeRule implements ActivationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationReservation): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ActivationReservationAllowedCodeRule implements ActivationReservationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationReservation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class ActivationReservationLabelLengthRule implements ActivationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationReservationRequiredChecksumRule implements ActivationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationReservation): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation reservation. */
export class ActivationReservationValidator {
  rules: ActivationReservationRule[];

  constructor(rules: ActivationReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationReservation[]): Map<string, string[]> {
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

export function defaultActivationReservationValidator(): ActivationReservationValidator {
  return new ActivationReservationValidator(
    [
      new ActivationReservationRequiredTitleRule("activation reservation needs an entry"),
      new ActivationReservationAttemptsRangeRule(16, 3600),
      new ActivationReservationAllowedCodeRule(["primary", "regional"]),
      new ActivationReservationLabelLengthRule(16),
      new ActivationReservationRequiredChecksumRule("activation reservation needs this field"),
    ],
  );
}
