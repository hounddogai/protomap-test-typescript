import { ModelReservation } from "./model-reservation.js";

/** A rule a model reservation must pass. Check returns its problems, or none. */
export interface ModelReservationRule {
  check(item: ModelReservation): string[];
}

export class ModelReservationSourceLengthRule implements ModelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelReservation): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelReservationCodeLengthRule implements ModelReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelReservationRequiredSourceRule implements ModelReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelReservation): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model reservation. */
export class ModelReservationValidator {
  rules: ModelReservationRule[];

  constructor(rules: ModelReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ModelReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelReservation[]): Map<string, string[]> {
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

export function defaultModelReservationValidator(): ModelReservationValidator {
  return new ModelReservationValidator(
    [
      new ModelReservationSourceLengthRule(32),
      new ModelReservationCodeLengthRule(3600),
      new ModelReservationRequiredSourceRule("model reservation needs this field"),
    ],
  );
}
