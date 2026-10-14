import { JourneyOverride } from "./journey-override.js";

/** A rule a journey override must pass. Check returns its problems, or none. */
export interface JourneyOverrideRule {
  check(item: JourneyOverride): string[];
}

export class JourneyOverrideNameLengthRule implements JourneyOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyOverrideVersionRangeRule implements JourneyOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyOverride): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class JourneyOverrideCategoryLengthRule implements JourneyOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyOverride): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey override. */
export class JourneyOverrideValidator {
  rules: JourneyOverrideRule[];

  constructor(rules: JourneyOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyOverride): string[] {
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

  requireValid(item: JourneyOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyOverride[]): Map<string, string[]> {
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

export function defaultJourneyOverrideValidator(): JourneyOverrideValidator {
  return new JourneyOverrideValidator(
    [
      new JourneyOverrideNameLengthRule(120),
      new JourneyOverrideVersionRangeRule(16, 3600),
      new JourneyOverrideCategoryLengthRule(255),
    ],
  );
}
