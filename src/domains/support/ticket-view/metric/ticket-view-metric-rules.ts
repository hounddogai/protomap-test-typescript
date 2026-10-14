import * as text from "../../../../kit/text.js";
import { TicketViewMetric } from "./ticket-view-metric.js";

/** A rule a ticket view metric must pass. Check returns its problems, or none. */
export interface TicketViewMetricRule {
  check(item: TicketViewMetric): string[];
}

export class TicketViewMetricActiveGuardRule implements TicketViewMetricRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TicketViewMetric): string[] {
    if (item.active && item.revision > this.limit) return [`revision ${item.revision} exceeds ${this.limit} while active`];
    return [];
  }
}

export class TicketViewMetricRevisionRangeRule implements TicketViewMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewMetric): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TicketViewMetricAllowedTitleRule implements TicketViewMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TicketViewMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

export class TicketViewMetricRequiredTitleRule implements TicketViewMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewMetricTitleLengthRule implements TicketViewMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewMetric): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewMetricNotesLengthRule implements TicketViewMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewMetric): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view metric. */
export class TicketViewMetricValidator {
  rules: TicketViewMetricRule[];

  constructor(rules: TicketViewMetricRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewMetric[]): Map<string, string[]> {
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

export function defaultTicketViewMetricValidator(): TicketViewMetricValidator {
  return new TicketViewMetricValidator(
    [
      new TicketViewMetricActiveGuardRule(86400),
      new TicketViewMetricRevisionRangeRule(16, 64),
      new TicketViewMetricAllowedTitleRule([]),
      new TicketViewMetricRequiredTitleRule("ticket view metric needs an entry"),
      new TicketViewMetricTitleLengthRule(80),
      new TicketViewMetricNotesLengthRule(80),
    ],
  );
}
