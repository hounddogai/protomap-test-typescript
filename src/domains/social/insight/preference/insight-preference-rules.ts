import { InsightPreference } from "./insight-preference.js";

/** A rule a insight preference must pass. Check returns its problems, or none. */
export interface InsightPreferenceRule {
  check(item: InsightPreference): string[];
}

export class InsightPreferenceRequiredNameRule implements InsightPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightPreference): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class InsightPreferenceNameLengthRule implements InsightPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightPreference): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightPreferenceCodeLengthRule implements InsightPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightPreferenceRequiredCodeRule implements InsightPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightPreference): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightPreferenceBatchSizeRangeRule implements InsightPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightPreference): string[] {
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

/** Runs every rule of a insight preference. */
export class InsightPreferenceValidator {
  rules: InsightPreferenceRule[];

  constructor(rules: InsightPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: InsightPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightPreference[]): Map<string, string[]> {
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

export function defaultInsightPreferenceValidator(): InsightPreferenceValidator {
  return new InsightPreferenceValidator(
    [
      new InsightPreferenceRequiredNameRule("insight preference needs an entry"),
      new InsightPreferenceNameLengthRule(3600),
      new InsightPreferenceCodeLengthRule(3600),
      new InsightPreferenceRequiredCodeRule("insight preference needs an entry"),
      new InsightPreferenceBatchSizeRangeRule(32, 255),
    ],
  );
}
