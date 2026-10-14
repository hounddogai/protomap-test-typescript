import { TieredTicketViewBaseline } from "./tiered-ticket-view-baseline.js";

/** A rule a tiered ticket view baseline must pass. Check returns its problems, or none. */
export interface TieredTicketViewBaselineRule {
  check(item: TieredTicketViewBaseline): string[];
}

export class TieredTicketViewBaselineNameLengthRule implements TieredTicketViewBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTicketViewBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTicketViewBaselineRequiredJourneyIdRule implements TieredTicketViewBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTicketViewBaseline): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTicketViewBaselineTitleLengthRule implements TieredTicketViewBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTicketViewBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTicketViewBaselineRequiredCodeRule implements TieredTicketViewBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTicketViewBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTicketViewBaselineRequiredTitleRule implements TieredTicketViewBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTicketViewBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTicketViewBaselineEndsAtRangeRule implements TieredTicketViewBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredTicketViewBaseline): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered ticket view baseline. */
export class TieredTicketViewBaselineValidator {
  rules: TieredTicketViewBaselineRule[];

  constructor(rules: TieredTicketViewBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTicketViewBaseline): string[] {
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

  requireValid(item: TieredTicketViewBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTicketViewBaseline[]): Map<string, string[]> {
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

export function defaultTieredTicketViewBaselineValidator(): TieredTicketViewBaselineValidator {
  return new TieredTicketViewBaselineValidator(
    [
      new TieredTicketViewBaselineNameLengthRule(86400),
      new TieredTicketViewBaselineRequiredJourneyIdRule("tiered ticket view baseline needs this field"),
      new TieredTicketViewBaselineTitleLengthRule(32),
      new TieredTicketViewBaselineRequiredCodeRule("tiered ticket view baseline needs a value"),
      new TieredTicketViewBaselineRequiredTitleRule("tiered ticket view baseline needs a value"),
      new TieredTicketViewBaselineEndsAtRangeRule(32, 86400),
    ],
  );
}
