import { TicketViewBaseline } from "./ticket-view-baseline.js";

/** A rule a ticket view baseline must pass. Check returns its problems, or none. */
export interface TicketViewBaselineRule {
  check(item: TicketViewBaseline): string[];
}

export class TicketViewBaselineLabelLengthRule implements TicketViewBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewBaselineBidRangeRule implements TicketViewBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewBaseline): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewBaselineCostRangeRule implements TicketViewBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewBaseline): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewBaselineRequiredCodeRule implements TicketViewBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewBaselineUtmSourceLengthRule implements TicketViewBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewBaseline): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewBaselineRequiredLabelRule implements TicketViewBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a ticket view baseline. */
export class TicketViewBaselineValidator {
  rules: TicketViewBaselineRule[];

  constructor(rules: TicketViewBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewBaseline[]): Map<string, string[]> {
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

export function defaultTicketViewBaselineValidator(): TicketViewBaselineValidator {
  return new TicketViewBaselineValidator(
    [
      new TicketViewBaselineLabelLengthRule(80),
      new TicketViewBaselineBidRangeRule(9.9, 2735.5),
      new TicketViewBaselineCostRangeRule(8.6, 328.3),
      new TicketViewBaselineRequiredCodeRule("ticket view baseline needs this field"),
      new TicketViewBaselineUtmSourceLengthRule(16),
      new TicketViewBaselineRequiredLabelRule("ticket view baseline needs an entry"),
    ],
  );
}
