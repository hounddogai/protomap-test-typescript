import { AdaptiveBadgeWindow } from "./adaptive-badge-window.js";

/** A rule a adaptive badge window must pass. Check returns its problems, or none. */
export interface AdaptiveBadgeWindowRule {
  check(item: AdaptiveBadgeWindow): string[];
}

export class AdaptiveBadgeWindowCodeLengthRule implements AdaptiveBadgeWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBadgeWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBadgeWindowCountryLengthRule implements AdaptiveBadgeWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBadgeWindow): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBadgeWindowLocaleLengthRule implements AdaptiveBadgeWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBadgeWindow): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBadgeWindowRequiredLabelRule implements AdaptiveBadgeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBadgeWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveBadgeWindowCodePrefixRule implements AdaptiveBadgeWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveBadgeWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveBadgeWindowCapacityRangeRule implements AdaptiveBadgeWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBadgeWindow): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive badge window. */
export class AdaptiveBadgeWindowValidator {
  rules: AdaptiveBadgeWindowRule[];

  constructor(rules: AdaptiveBadgeWindowRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBadgeWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveBadgeWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBadgeWindow[]): Map<string, string[]> {
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

export function defaultAdaptiveBadgeWindowValidator(): AdaptiveBadgeWindowValidator {
  return new AdaptiveBadgeWindowValidator(
    [
      new AdaptiveBadgeWindowCodeLengthRule(86400),
      new AdaptiveBadgeWindowCountryLengthRule(1000),
      new AdaptiveBadgeWindowLocaleLengthRule(64),
      new AdaptiveBadgeWindowRequiredLabelRule("adaptive badge window needs this field"),
      new AdaptiveBadgeWindowCodePrefixRule("Q"),
      new AdaptiveBadgeWindowCapacityRangeRule(16, 120),
    ],
  );
}
