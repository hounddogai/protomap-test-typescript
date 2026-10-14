import * as text from "../../../../kit/text.js";
import { AdaptiveTicketViewSummary } from "./adaptive-ticket-view-summary.js";

/** A rule a adaptive ticket view summary must pass. Check returns its problems, or none. */
export interface AdaptiveTicketViewSummaryRule {
  check(item: AdaptiveTicketViewSummary): string[];
}

export class AdaptiveTicketViewSummaryRequiredTimezoneRule implements AdaptiveTicketViewSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTicketViewSummary): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveTicketViewSummaryRequiredLabelRule implements AdaptiveTicketViewSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTicketViewSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveTicketViewSummaryLimitRangeRule implements AdaptiveTicketViewSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveTicketViewSummary): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveTicketViewSummaryAllowedCodeRule implements AdaptiveTicketViewSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveTicketViewSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class AdaptiveTicketViewSummaryTimezoneLengthRule implements AdaptiveTicketViewSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveTicketViewSummary): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive ticket view summary. */
export class AdaptiveTicketViewSummaryValidator {
  rules: AdaptiveTicketViewSummaryRule[];

  constructor(rules: AdaptiveTicketViewSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveTicketViewSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveTicketViewSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveTicketViewSummary[]): Map<string, string[]> {
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

export function defaultAdaptiveTicketViewSummaryValidator(): AdaptiveTicketViewSummaryValidator {
  return new AdaptiveTicketViewSummaryValidator(
    [
      new AdaptiveTicketViewSummaryRequiredTimezoneRule("adaptive ticket view summary needs this field"),
      new AdaptiveTicketViewSummaryRequiredLabelRule("adaptive ticket view summary needs an entry"),
      new AdaptiveTicketViewSummaryLimitRangeRule(64, 255),
      new AdaptiveTicketViewSummaryAllowedCodeRule([]),
      new AdaptiveTicketViewSummaryTimezoneLengthRule(16),
    ],
  );
}
