import { PlacementBundle } from "./placement-bundle.js";

/** A rule a placement bundle must pass. Check returns its problems, or none. */
export interface PlacementBundleRule {
  check(item: PlacementBundle): string[];
}

export class PlacementBundleChecksumLengthRule implements PlacementBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementBundle): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementBundleCreatedAtRangeRule implements PlacementBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementBundle): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementBundleMarginRangeRule implements PlacementBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementBundle): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a placement bundle. */
export class PlacementBundleValidator {
  rules: PlacementBundleRule[];

  constructor(rules: PlacementBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementBundle[]): Map<string, string[]> {
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

export function defaultPlacementBundleValidator(): PlacementBundleValidator {
  return new PlacementBundleValidator(
    [
      new PlacementBundleChecksumLengthRule(120),
      new PlacementBundleCreatedAtRangeRule(64, 86400),
      new PlacementBundleMarginRangeRule(6, 2819),
    ],
  );
}
