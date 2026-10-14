import { TicketViewPreference } from "./ticket-view-preference.js";

/** A rule a ticket view preference must pass. Check returns its problems, or none. */
export interface TicketViewPreferenceRule {
  check(item: TicketViewPreference): string[];
}

export class TicketViewPreferenceCodePrefixRule implements TicketViewPreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewPreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewPreferenceBidRangeRule implements TicketViewPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewPreference): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewPreferenceRequiredLocaleRule implements TicketViewPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewPreference): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewPreferenceLocaleLengthRule implements TicketViewPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewPreference): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewPreferenceRequiredTitleRule implements TicketViewPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewPreferenceRateRangeRule implements TicketViewPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewPreference): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a ticket view preference. */
export class TicketViewPreferenceValidator {
  rules: TicketViewPreferenceRule[];

  constructor(rules: TicketViewPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewPreference): string[] {
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

  requireValid(item: TicketViewPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewPreference[]): Map<string, string[]> {
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

export function defaultTicketViewPreferenceValidator(): TicketViewPreferenceValidator {
  return new TicketViewPreferenceValidator(
    [
      new TicketViewPreferenceCodePrefixRule("Q"),
      new TicketViewPreferenceBidRangeRule(0.9, 504.9),
      new TicketViewPreferenceRequiredLocaleRule("ticket view preference needs an entry"),
      new TicketViewPreferenceLocaleLengthRule(255),
      new TicketViewPreferenceRequiredTitleRule("ticket view preference needs a value"),
      new TicketViewPreferenceRateRangeRule(4.7, 2150.3),
    ],
  );
}
