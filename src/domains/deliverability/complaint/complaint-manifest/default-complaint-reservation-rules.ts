import { DefaultComplaintReservation } from "./default-complaint-reservation.js";

/** A rule a default complaint reservation must pass. Check returns its problems, or none. */
export interface DefaultComplaintReservationRule {
  check(item: DefaultComplaintReservation): string[];
}

export class DefaultComplaintReservationBudgetRangeRule implements DefaultComplaintReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultComplaintReservation): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultComplaintReservationCodePrefixRule implements DefaultComplaintReservationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultComplaintReservation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultComplaintReservationRequiredCodeRule implements DefaultComplaintReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultComplaintReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultComplaintReservationRequiredTitleRule implements DefaultComplaintReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultComplaintReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultComplaintReservationDiscountRangeRule implements DefaultComplaintReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultComplaintReservation): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultComplaintReservationCodeLengthRule implements DefaultComplaintReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultComplaintReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default complaint reservation. */
export class DefaultComplaintReservationValidator {
  rules: DefaultComplaintReservationRule[];

  constructor(rules: DefaultComplaintReservationRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultComplaintReservation): string[] {
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

  requireValid(item: DefaultComplaintReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultComplaintReservation[]): Map<string, string[]> {
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

export function defaultDefaultComplaintReservationValidator(): DefaultComplaintReservationValidator {
  return new DefaultComplaintReservationValidator(
    [
      new DefaultComplaintReservationBudgetRangeRule(2.8, 2405.4),
      new DefaultComplaintReservationCodePrefixRule("Q"),
      new DefaultComplaintReservationRequiredCodeRule("default complaint reservation needs an entry"),
      new DefaultComplaintReservationRequiredTitleRule("default complaint reservation needs a value"),
      new DefaultComplaintReservationDiscountRangeRule(1.5, 2771.2),
      new DefaultComplaintReservationCodeLengthRule(3600),
    ],
  );
}
