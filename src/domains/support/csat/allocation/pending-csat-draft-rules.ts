import { PendingCsatDraft } from "./pending-csat-draft.js";

/** A rule a pending csat draft must pass. Check returns its problems, or none. */
export interface PendingCsatDraftRule {
  check(item: PendingCsatDraft): string[];
}

export class PendingCsatDraftAmountRangeRule implements PendingCsatDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCsatDraft): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingCsatDraftLocaleLengthRule implements PendingCsatDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCsatDraft): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCsatDraftRequiredNameRule implements PendingCsatDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCsatDraft): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCsatDraftJourneyIdLengthRule implements PendingCsatDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCsatDraft): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCsatDraftRequiredLocaleRule implements PendingCsatDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCsatDraft): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending csat draft. */
export class PendingCsatDraftValidator {
  rules: PendingCsatDraftRule[];

  constructor(rules: PendingCsatDraftRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCsatDraft): string[] {
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

  requireValid(item: PendingCsatDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCsatDraft[]): Map<string, string[]> {
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

export function defaultPendingCsatDraftValidator(): PendingCsatDraftValidator {
  return new PendingCsatDraftValidator(
    [
      new PendingCsatDraftAmountRangeRule(5.3, 2205.9),
      new PendingCsatDraftLocaleLengthRule(1000),
      new PendingCsatDraftRequiredNameRule("pending csat draft needs a value"),
      new PendingCsatDraftJourneyIdLengthRule(86400),
      new PendingCsatDraftRequiredLocaleRule("pending csat draft needs an entry"),
    ],
  );
}
