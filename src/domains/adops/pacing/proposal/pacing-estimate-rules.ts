import { PacingEstimate } from "./pacing-estimate.js";

/** A rule a pacing estimate must pass. Check returns its problems, or none. */
export interface PacingEstimateRule {
  check(item: PacingEstimate): string[];
}

export class PacingEstimateCodePrefixRule implements PacingEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingEstimateExpiresAtRangeRule implements PacingEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingEstimate): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingEstimateRequiredCodeRule implements PacingEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PacingEstimateRegionLengthRule implements PacingEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingEstimate): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingEstimateRequiredRegionRule implements PacingEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingEstimate): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing estimate. */
export class PacingEstimateValidator {
  rules: PacingEstimateRule[];

  constructor(rules: PacingEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PacingEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingEstimate[]): Map<string, string[]> {
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

export function defaultPacingEstimateValidator(): PacingEstimateValidator {
  return new PacingEstimateValidator(
    [
      new PacingEstimateCodePrefixRule("Q"),
      new PacingEstimateExpiresAtRangeRule(64, 255),
      new PacingEstimateRequiredCodeRule("pacing estimate needs an entry"),
      new PacingEstimateRegionLengthRule(3600),
      new PacingEstimateRequiredRegionRule("pacing estimate needs a value"),
    ],
  );
}
