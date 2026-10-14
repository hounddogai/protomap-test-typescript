import { DefaultPlacementEstimate } from "./default-placement-estimate.js";

/** A rule a default placement estimate must pass. Check returns its problems, or none. */
export interface DefaultPlacementEstimateRule {
  check(item: DefaultPlacementEstimate): string[];
}

export class DefaultPlacementEstimateLabelLengthRule implements DefaultPlacementEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPlacementEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPlacementEstimateLocaleLengthRule implements DefaultPlacementEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPlacementEstimate): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPlacementEstimateRequiredLocaleRule implements DefaultPlacementEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPlacementEstimate): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default placement estimate. */
export class DefaultPlacementEstimateValidator {
  rules: DefaultPlacementEstimateRule[];

  constructor(rules: DefaultPlacementEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPlacementEstimate): string[] {
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

  requireValid(item: DefaultPlacementEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPlacementEstimate[]): Map<string, string[]> {
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

export function defaultDefaultPlacementEstimateValidator(): DefaultPlacementEstimateValidator {
  return new DefaultPlacementEstimateValidator(
    [
      new DefaultPlacementEstimateLabelLengthRule(32),
      new DefaultPlacementEstimateLocaleLengthRule(64),
      new DefaultPlacementEstimateRequiredLocaleRule("default placement estimate needs an entry"),
    ],
  );
}
