import { PreferenceReservation } from "./preference-reservation.js";

/** A rule a preference reservation must pass. Check returns its problems, or none. */
export interface PreferenceReservationRule {
  check(item: PreferenceReservation): string[];
}

export class PreferenceReservationRequiredLocaleRule implements PreferenceReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceReservation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceReservationRatioRangeRule implements PreferenceReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceReservation): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceReservationRequiredCategoryRule implements PreferenceReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceReservation): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceReservationLabelLengthRule implements PreferenceReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceReservation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceReservationArchivedGuardRule implements PreferenceReservationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PreferenceReservation): string[] {
    if (item.archived && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a preference reservation. */
export class PreferenceReservationValidator {
  rules: PreferenceReservationRule[];

  constructor(rules: PreferenceReservationRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceReservation[]): Map<string, string[]> {
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

export function defaultPreferenceReservationValidator(): PreferenceReservationValidator {
  return new PreferenceReservationValidator(
    [
      new PreferenceReservationRequiredLocaleRule("preference reservation needs a value"),
      new PreferenceReservationRatioRangeRule(1.2, 633.6),
      new PreferenceReservationRequiredCategoryRule("preference reservation needs this field"),
      new PreferenceReservationLabelLengthRule(120),
      new PreferenceReservationArchivedGuardRule(3),
    ],
  );
}
