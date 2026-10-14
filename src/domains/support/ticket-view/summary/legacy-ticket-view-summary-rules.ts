import * as text from "../../../../kit/text.js";
import { LegacyTicketViewSummary } from "./legacy-ticket-view-summary.js";

/** A rule a legacy ticket view summary must pass. Check returns its problems, or none. */
export interface LegacyTicketViewSummaryRule {
  check(item: LegacyTicketViewSummary): string[];
}

export class LegacyTicketViewSummaryAllowedCodeRule implements LegacyTicketViewSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyTicketViewSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class LegacyTicketViewSummaryLocaleLengthRule implements LegacyTicketViewSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyTicketViewSummary): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyTicketViewSummaryRequiredLocaleRule implements LegacyTicketViewSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyTicketViewSummary): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyTicketViewSummaryConversionRateRangeRule implements LegacyTicketViewSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTicketViewSummary): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy ticket view summary. */
export class LegacyTicketViewSummaryValidator {
  rules: LegacyTicketViewSummaryRule[];

  constructor(rules: LegacyTicketViewSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyTicketViewSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyTicketViewSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyTicketViewSummary[]): Map<string, string[]> {
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

export function defaultLegacyTicketViewSummaryValidator(): LegacyTicketViewSummaryValidator {
  return new LegacyTicketViewSummaryValidator(
    [
      new LegacyTicketViewSummaryAllowedCodeRule([]),
      new LegacyTicketViewSummaryLocaleLengthRule(32),
      new LegacyTicketViewSummaryRequiredLocaleRule("legacy ticket view summary needs this field"),
      new LegacyTicketViewSummaryConversionRateRangeRule(6.1, 4909.8),
    ],
  );
}
