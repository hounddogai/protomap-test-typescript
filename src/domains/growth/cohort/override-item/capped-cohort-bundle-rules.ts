import { CappedCohortBundle } from "./capped-cohort-bundle.js";

/** A rule a capped cohort bundle must pass. Check returns its problems, or none. */
export interface CappedCohortBundleRule {
  check(item: CappedCohortBundle): string[];
}

export class CappedCohortBundleWeightRangeRule implements CappedCohortBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCohortBundle): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedCohortBundleRequiredNameRule implements CappedCohortBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCohortBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCohortBundleNameLengthRule implements CappedCohortBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCohortBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCohortBundleStartsAtRangeRule implements CappedCohortBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCohortBundle): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedCohortBundleVersionRangeRule implements CappedCohortBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCohortBundle): string[] {
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

/** Runs every rule of a capped cohort bundle. */
export class CappedCohortBundleValidator {
  rules: CappedCohortBundleRule[];

  constructor(rules: CappedCohortBundleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCohortBundle): string[] {
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

  requireValid(item: CappedCohortBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCohortBundle[]): Map<string, string[]> {
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

export function defaultCappedCohortBundleValidator(): CappedCohortBundleValidator {
  return new CappedCohortBundleValidator(
    [
      new CappedCohortBundleWeightRangeRule(8, 4470.4),
      new CappedCohortBundleRequiredNameRule("capped cohort bundle needs a value"),
      new CappedCohortBundleNameLengthRule(1000),
      new CappedCohortBundleStartsAtRangeRule(3600, 86400),
      new CappedCohortBundleVersionRangeRule(120, 86400),
    ],
  );
}
