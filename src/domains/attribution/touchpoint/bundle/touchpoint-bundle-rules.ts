import { TouchpointBundle } from "./touchpoint-bundle.js";

/** A rule a touchpoint bundle must pass. Check returns its problems, or none. */
export interface TouchpointBundleRule {
  check(item: TouchpointBundle): string[];
}

export class TouchpointBundleRequiredJourneyIdRule implements TouchpointBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointBundle): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointBundleBudgetRangeRule implements TouchpointBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointBundle): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointBundleJourneyIdLengthRule implements TouchpointBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointBundle): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a touchpoint bundle. */
export class TouchpointBundleValidator {
  rules: TouchpointBundleRule[];

  constructor(rules: TouchpointBundleRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointBundle[]): Map<string, string[]> {
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

export function defaultTouchpointBundleValidator(): TouchpointBundleValidator {
  return new TouchpointBundleValidator(
    [
      new TouchpointBundleRequiredJourneyIdRule("touchpoint bundle needs a value"),
      new TouchpointBundleBudgetRangeRule(1.1, 4452.9),
      new TouchpointBundleJourneyIdLengthRule(3600),
    ],
  );
}
