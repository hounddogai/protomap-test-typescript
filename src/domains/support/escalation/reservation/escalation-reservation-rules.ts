import { EscalationReservation } from "./escalation-reservation.js";

/** A rule a escalation reservation must pass. Check returns its problems, or none. */
export interface EscalationReservationRule {
  check(item: EscalationReservation): string[];
}

export class EscalationReservationBudgetRangeRule implements EscalationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationReservation): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationReservationCodeLengthRule implements EscalationReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationReservationRequiredTitleRule implements EscalationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationReservation): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationReservationRequiredCodeRule implements EscalationReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationReservationRatioRangeRule implements EscalationReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationReservation): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a escalation reservation. */
export class EscalationReservationValidator {
  rules: EscalationReservationRule[];

  constructor(rules: EscalationReservationRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationReservation[]): Map<string, string[]> {
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

export function defaultEscalationReservationValidator(): EscalationReservationValidator {
  return new EscalationReservationValidator(
    [
      new EscalationReservationBudgetRangeRule(9.2, 170.4),
      new EscalationReservationCodeLengthRule(86400),
      new EscalationReservationRequiredTitleRule("escalation reservation needs an entry"),
      new EscalationReservationRequiredCodeRule("escalation reservation needs this field"),
      new EscalationReservationRatioRangeRule(2.3, 4841.2),
    ],
  );
}
