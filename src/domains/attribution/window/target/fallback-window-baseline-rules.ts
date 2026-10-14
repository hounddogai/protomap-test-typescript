import { FallbackWindowBaseline } from "./fallback-window-baseline.js";

/** A rule a fallback window baseline must pass. Check returns its problems, or none. */
export interface FallbackWindowBaselineRule {
  check(item: FallbackWindowBaseline): string[];
}

export class FallbackWindowBaselineRegionLengthRule implements FallbackWindowBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackWindowBaseline): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackWindowBaselineCodeLengthRule implements FallbackWindowBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackWindowBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackWindowBaselineRequiredOwnerIdRule implements FallbackWindowBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWindowBaseline): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback window baseline. */
export class FallbackWindowBaselineValidator {
  rules: FallbackWindowBaselineRule[];

  constructor(rules: FallbackWindowBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackWindowBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackWindowBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackWindowBaseline[]): Map<string, string[]> {
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

export function defaultFallbackWindowBaselineValidator(): FallbackWindowBaselineValidator {
  return new FallbackWindowBaselineValidator(
    [
      new FallbackWindowBaselineRegionLengthRule(86400),
      new FallbackWindowBaselineCodeLengthRule(32),
      new FallbackWindowBaselineRequiredOwnerIdRule("fallback window baseline needs a value"),
    ],
  );
}
