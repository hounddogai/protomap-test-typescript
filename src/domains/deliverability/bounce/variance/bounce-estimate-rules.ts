import { BounceEstimate } from "./bounce-estimate.js";

/** A rule a bounce estimate must pass. Check returns its problems, or none. */
export interface BounceEstimateRule {
  check(item: BounceEstimate): string[];
}

export class BounceEstimateUtmSourceLengthRule implements BounceEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceEstimate): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceEstimateRequiredUtmSourceRule implements BounceEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceEstimate): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class BounceEstimateJourneyIdLengthRule implements BounceEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceEstimate): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce estimate. */
export class BounceEstimateValidator {
  rules: BounceEstimateRule[];

  constructor(rules: BounceEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: BounceEstimate): string[] {
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

  requireValid(item: BounceEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceEstimate[]): Map<string, string[]> {
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

export function defaultBounceEstimateValidator(): BounceEstimateValidator {
  return new BounceEstimateValidator(
    [
      new BounceEstimateUtmSourceLengthRule(1000),
      new BounceEstimateRequiredUtmSourceRule("bounce estimate needs a value"),
      new BounceEstimateJourneyIdLengthRule(16),
    ],
  );
}
