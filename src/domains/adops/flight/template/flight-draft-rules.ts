import * as text from "../../../../kit/text.js";
import { FlightDraft } from "./flight-draft.js";

/** A rule a flight draft must pass. Check returns its problems, or none. */
export interface FlightDraftRule {
  check(item: FlightDraft): string[];
}

export class FlightDraftCodePrefixRule implements FlightDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FlightDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FlightDraftTitleLengthRule implements FlightDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightDraft): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightDraftAllowedLabelRule implements FlightDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FlightDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class FlightDraftNotesLengthRule implements FlightDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightDraft): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightDraftRequiredLabelRule implements FlightDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FlightDraftConversionRateRangeRule implements FlightDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightDraft): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a flight draft. */
export class FlightDraftValidator {
  rules: FlightDraftRule[];

  constructor(rules: FlightDraftRule[]) {
    this.rules = rules;
  }

  validate(item: FlightDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightDraft[]): Map<string, string[]> {
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

export function defaultFlightDraftValidator(): FlightDraftValidator {
  return new FlightDraftValidator(
    [
      new FlightDraftCodePrefixRule("Q"),
      new FlightDraftTitleLengthRule(64),
      new FlightDraftAllowedLabelRule(["regional", "pending"]),
      new FlightDraftNotesLengthRule(80),
      new FlightDraftRequiredLabelRule("flight draft needs a value"),
      new FlightDraftConversionRateRangeRule(0.3, 2974.7),
    ],
  );
}
