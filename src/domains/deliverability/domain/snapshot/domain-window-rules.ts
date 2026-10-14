import { DomainWindow } from "./domain-window.js";

/** A rule a domain window must pass. Check returns its problems, or none. */
export interface DomainWindowRule {
  check(item: DomainWindow): string[];
}

export class DomainWindowSegmentLengthRule implements DomainWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainWindow): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainWindowSequenceRangeRule implements DomainWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainWindow): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainWindowLabelLengthRule implements DomainWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainWindowRequiredLabelRule implements DomainWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DomainWindowBudgetRangeRule implements DomainWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainWindow): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainWindowCountryLengthRule implements DomainWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainWindow): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a domain window. */
export class DomainWindowValidator {
  rules: DomainWindowRule[];

  constructor(rules: DomainWindowRule[]) {
    this.rules = rules;
  }

  validate(item: DomainWindow): string[] {
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

  requireValid(item: DomainWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainWindow[]): Map<string, string[]> {
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

export function defaultDomainWindowValidator(): DomainWindowValidator {
  return new DomainWindowValidator(
    [
      new DomainWindowSegmentLengthRule(64),
      new DomainWindowSequenceRangeRule(80, 3600),
      new DomainWindowLabelLengthRule(120),
      new DomainWindowRequiredLabelRule("domain window needs a value"),
      new DomainWindowBudgetRangeRule(6.6, 849.9),
      new DomainWindowCountryLengthRule(120),
    ],
  );
}
