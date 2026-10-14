import { ExitRuleReservation } from "./exit-rule-reservation.js";

/** A rule a exit rule reservation must pass. Check returns its problems, or none. */
export interface ExitRuleReservationRule {
  check(item: ExitRuleReservation): string[];
}

export class ExitRuleReservationTimezoneLengthRule implements ExitRuleReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleReservation): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleReservationCostRangeRule implements ExitRuleReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleReservation): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleReservationImpressionsRangeRule implements ExitRuleReservationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleReservation): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleReservationRequiredNameRule implements ExitRuleReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleReservation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleReservationCodeLengthRule implements ExitRuleReservationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleReservation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleReservationRequiredChannelRule implements ExitRuleReservationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleReservation): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a exit rule reservation. */
export class ExitRuleReservationValidator {
  rules: ExitRuleReservationRule[];

  constructor(rules: ExitRuleReservationRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleReservation): string[] {
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

  requireValid(item: ExitRuleReservation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleReservation[]): Map<string, string[]> {
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

export function defaultExitRuleReservationValidator(): ExitRuleReservationValidator {
  return new ExitRuleReservationValidator(
    [
      new ExitRuleReservationTimezoneLengthRule(32),
      new ExitRuleReservationCostRangeRule(5.3, 1222.7),
      new ExitRuleReservationImpressionsRangeRule(16, 80),
      new ExitRuleReservationRequiredNameRule("exit rule reservation needs a value"),
      new ExitRuleReservationCodeLengthRule(120),
      new ExitRuleReservationRequiredChannelRule("exit rule reservation needs this field"),
    ],
  );
}
