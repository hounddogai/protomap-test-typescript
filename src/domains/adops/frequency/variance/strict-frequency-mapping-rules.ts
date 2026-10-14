import { StrictFrequencyMapping } from "./strict-frequency-mapping.js";

/** A rule a strict frequency mapping must pass. Check returns its problems, or none. */
export interface StrictFrequencyMappingRule {
  check(item: StrictFrequencyMapping): string[];
}

export class StrictFrequencyMappingBudgetRangeRule implements StrictFrequencyMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictFrequencyMapping): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictFrequencyMappingRequiredTimezoneRule implements StrictFrequencyMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictFrequencyMapping): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class StrictFrequencyMappingRequiredDescriptionRule implements StrictFrequencyMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictFrequencyMapping): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class StrictFrequencyMappingSendAtRangeRule implements StrictFrequencyMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictFrequencyMapping): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictFrequencyMappingCodeLengthRule implements StrictFrequencyMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictFrequencyMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict frequency mapping. */
export class StrictFrequencyMappingValidator {
  rules: StrictFrequencyMappingRule[];

  constructor(rules: StrictFrequencyMappingRule[]) {
    this.rules = rules;
  }

  validate(item: StrictFrequencyMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictFrequencyMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictFrequencyMapping[]): Map<string, string[]> {
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

export function defaultStrictFrequencyMappingValidator(): StrictFrequencyMappingValidator {
  return new StrictFrequencyMappingValidator(
    [
      new StrictFrequencyMappingBudgetRangeRule(8.9, 2236.7),
      new StrictFrequencyMappingRequiredTimezoneRule("strict frequency mapping needs an entry"),
      new StrictFrequencyMappingRequiredDescriptionRule("strict frequency mapping needs a value"),
      new StrictFrequencyMappingSendAtRangeRule(120, 1000),
      new StrictFrequencyMappingCodeLengthRule(80),
    ],
  );
}
