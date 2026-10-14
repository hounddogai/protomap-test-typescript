import { CreativeBundle } from "./creative-bundle.js";

/** A rule a creative bundle must pass. Check returns its problems, or none. */
export interface CreativeBundleRule {
  check(item: CreativeBundle): string[];
}

export class CreativeBundleBidRangeRule implements CreativeBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeBundle): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeBundleLocaleLengthRule implements CreativeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeBundle): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeBundleCreatedAtRangeRule implements CreativeBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeBundle): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeBundleRequiredLocaleRule implements CreativeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeBundle): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeBundleNameLengthRule implements CreativeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeBundleRequiredCohortRule implements CreativeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeBundle): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a creative bundle. */
export class CreativeBundleValidator {
  rules: CreativeBundleRule[];

  constructor(rules: CreativeBundleRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeBundle[]): Map<string, string[]> {
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

export function defaultCreativeBundleValidator(): CreativeBundleValidator {
  return new CreativeBundleValidator(
    [
      new CreativeBundleBidRangeRule(2.4, 3459.5),
      new CreativeBundleLocaleLengthRule(80),
      new CreativeBundleCreatedAtRangeRule(32, 120),
      new CreativeBundleRequiredLocaleRule("creative bundle needs an entry"),
      new CreativeBundleNameLengthRule(16),
      new CreativeBundleRequiredCohortRule("creative bundle needs an entry"),
    ],
  );
}
