import { PrimaryLevelWindow } from "./primary-level-window.js";

/** A rule a primary level window must pass. Check returns its problems, or none. */
export interface PrimaryLevelWindowRule {
  check(item: PrimaryLevelWindow): string[];
}

export class PrimaryLevelWindowNameLengthRule implements PrimaryLevelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLevelWindow): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryLevelWindowRequiredLabelRule implements PrimaryLevelWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryLevelWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryLevelWindowCodeLengthRule implements PrimaryLevelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLevelWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryLevelWindowConversionRateRangeRule implements PrimaryLevelWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLevelWindow): string[] {
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

export class PrimaryLevelWindowCategoryLengthRule implements PrimaryLevelWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLevelWindow): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryLevelWindowBatchSizeRangeRule implements PrimaryLevelWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLevelWindow): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary level window. */
export class PrimaryLevelWindowValidator {
  rules: PrimaryLevelWindowRule[];

  constructor(rules: PrimaryLevelWindowRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryLevelWindow): string[] {
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

  requireValid(item: PrimaryLevelWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryLevelWindow[]): Map<string, string[]> {
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

export function defaultPrimaryLevelWindowValidator(): PrimaryLevelWindowValidator {
  return new PrimaryLevelWindowValidator(
    [
      new PrimaryLevelWindowNameLengthRule(32),
      new PrimaryLevelWindowRequiredLabelRule("primary level window needs this field"),
      new PrimaryLevelWindowCodeLengthRule(255),
      new PrimaryLevelWindowConversionRateRangeRule(8.9, 4953.1),
      new PrimaryLevelWindowCategoryLengthRule(1000),
      new PrimaryLevelWindowBatchSizeRangeRule(1000, 3600),
    ],
  );
}
