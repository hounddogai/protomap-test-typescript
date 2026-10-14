import { TieredRewardRuleReservation } from "./tiered-reward-rule-reservation.js";

/** A rule a tiered reward rule reservation must pass. Check returns its problems, or none. */
export interface TieredRewardRuleReservationRule {
  check(item: TieredRewardRuleReservation): string[];
}

export class TieredRewardRuleReservationDurationMinutesRangeRule implements TieredRewardRuleReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardRuleReservation): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredRewardRuleReservationRequiredCodeRule implements TieredRewardRuleReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleReservation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleReservationRequiredContactEmailRule implements TieredRewardRuleReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleReservation): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleReservationNameLengthRule implements TieredRewardRuleReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardRuleReservation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardRuleReservationRequiredLabelRule implements TieredRewardRuleReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardRuleReservation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardRuleReservationSequenceRangeRule implements TieredRewardRuleReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredRewardRuleReservation): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered reward rule reservation. */
export class TieredRewardRuleReservationValidator {
  rules: TieredRewardRuleReservationRule[];

  constructor(rules: TieredRewardRuleReservationRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRewardRuleReservation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredRewardRuleReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRewardRuleReservation[]): Map<string, string[]> {
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

export function defaultTieredRewardRuleReservationValidator(): TieredRewardRuleReservationValidator {
  return new TieredRewardRuleReservationValidator(
    [
      new TieredRewardRuleReservationDurationMinutesRangeRule(16, 80),
      new TieredRewardRuleReservationRequiredCodeRule("tiered reward rule reservation needs a value"),
      new TieredRewardRuleReservationRequiredContactEmailRule("tiered reward rule reservation needs a value"),
      new TieredRewardRuleReservationNameLengthRule(16),
      new TieredRewardRuleReservationRequiredLabelRule("tiered reward rule reservation needs an entry"),
      new TieredRewardRuleReservationSequenceRangeRule(32, 3600),
    ],
  );
}
