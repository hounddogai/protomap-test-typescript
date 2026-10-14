import { InsightReservation } from "./insight-reservation.js";

/** A rule a insight reservation must pass. Check returns its problems, or none. */
export interface InsightReservationRule {
  check(item: InsightReservation): string[];
}

export class InsightReservationExpiresAtRangeRule implements InsightReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightReservation): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightReservationRequiredCodeRule implements InsightReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightReservationSendAtRangeRule implements InsightReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightReservation): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightReservationBudgetRangeRule implements InsightReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightReservation): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightReservationSourceLengthRule implements InsightReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightReservation): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a insight reservation. */
export class InsightReservationValidator {
  rules: InsightReservationRule[];

  constructor(rules: InsightReservationRule[]) {
    this.rules = rules;
  }

  validate(item: InsightReservation): string[] {
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

  requireValid(item: InsightReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightReservation[]): Map<string, string[]> {
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

export function defaultInsightReservationValidator(): InsightReservationValidator {
  return new InsightReservationValidator(
    [
      new InsightReservationExpiresAtRangeRule(16, 86400),
      new InsightReservationRequiredCodeRule("insight reservation needs this field"),
      new InsightReservationSendAtRangeRule(120, 255),
      new InsightReservationBudgetRangeRule(0.7, 1254.7),
      new InsightReservationSourceLengthRule(255),
    ],
  );
}
