import { SenderWindow } from "./sender-window.js";

/** A rule a sender window must pass. Check returns its problems, or none. */
export interface SenderWindowRule {
  check(item: SenderWindow): string[];
}

export class SenderWindowJourneyIdLengthRule implements SenderWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderWindow): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderWindowRequiredJourneyIdRule implements SenderWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderWindow): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class SenderWindowConversionRateRangeRule implements SenderWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderWindow): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderWindowRequiredCategoryRule implements SenderWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderWindow): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class SenderWindowRequiredCodeRule implements SenderWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderWindowRequiredTitleRule implements SenderWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender window. */
export class SenderWindowValidator {
  rules: SenderWindowRule[];

  constructor(rules: SenderWindowRule[]) {
    this.rules = rules;
  }

  validate(item: SenderWindow): string[] {
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

  requireValid(item: SenderWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderWindow[]): Map<string, string[]> {
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

export function defaultSenderWindowValidator(): SenderWindowValidator {
  return new SenderWindowValidator(
    [
      new SenderWindowJourneyIdLengthRule(1000),
      new SenderWindowRequiredJourneyIdRule("sender window needs this field"),
      new SenderWindowConversionRateRangeRule(4.7, 2386.1),
      new SenderWindowRequiredCategoryRule("sender window needs a value"),
      new SenderWindowRequiredCodeRule("sender window needs a value"),
      new SenderWindowRequiredTitleRule("sender window needs an entry"),
    ],
  );
}
