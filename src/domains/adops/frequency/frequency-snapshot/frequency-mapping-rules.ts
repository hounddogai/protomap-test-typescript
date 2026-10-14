import { FrequencyMapping } from "./frequency-mapping.js";

/** A rule a frequency mapping must pass. Check returns its problems, or none. */
export interface FrequencyMappingRule {
  check(item: FrequencyMapping): string[];
}

export class FrequencyMappingPhoneLengthRule implements FrequencyMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyMapping): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyMappingTimezoneLengthRule implements FrequencyMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyMapping): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyMappingBudgetRangeRule implements FrequencyMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyMapping): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencyMappingClicksRangeRule implements FrequencyMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyMapping): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencyMappingNameLengthRule implements FrequencyMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a frequency mapping. */
export class FrequencyMappingValidator {
  rules: FrequencyMappingRule[];

  constructor(rules: FrequencyMappingRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyMapping[]): Map<string, string[]> {
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

export function defaultFrequencyMappingValidator(): FrequencyMappingValidator {
  return new FrequencyMappingValidator(
    [
      new FrequencyMappingPhoneLengthRule(120),
      new FrequencyMappingTimezoneLengthRule(3600),
      new FrequencyMappingBudgetRangeRule(9, 2543.3),
      new FrequencyMappingClicksRangeRule(255, 1000),
      new FrequencyMappingNameLengthRule(64),
    ],
  );
}
