import { GlobalPostReservation } from "./global-post-reservation.js";

/** A rule a global post reservation must pass. Check returns its problems, or none. */
export interface GlobalPostReservationRule {
  check(item: GlobalPostReservation): string[];
}

export class GlobalPostReservationRequiredTitleRule implements GlobalPostReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPostReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPostReservationVersionRangeRule implements GlobalPostReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPostReservation): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalPostReservationCategoryLengthRule implements GlobalPostReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPostReservation): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global post reservation. */
export class GlobalPostReservationValidator {
  rules: GlobalPostReservationRule[];

  constructor(rules: GlobalPostReservationRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPostReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalPostReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPostReservation[]): Map<string, string[]> {
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

export function defaultGlobalPostReservationValidator(): GlobalPostReservationValidator {
  return new GlobalPostReservationValidator(
    [
      new GlobalPostReservationRequiredTitleRule("global post reservation needs this field"),
      new GlobalPostReservationVersionRangeRule(80, 255),
      new GlobalPostReservationCategoryLengthRule(120),
    ],
  );
}
