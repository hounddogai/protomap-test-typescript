import { FrequencyEstimate } from "./frequency-estimate.js";

/** A rule a frequency estimate must pass. Check returns its problems, or none. */
export interface FrequencyEstimateRule {
  check(item: FrequencyEstimate): string[];
}

export class FrequencyEstimateGraceDaysRangeRule implements FrequencyEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyEstimate): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FrequencyEstimateAudienceIdLengthRule implements FrequencyEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyEstimate): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyEstimateLabelLengthRule implements FrequencyEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyEstimateRequiredLabelRule implements FrequencyEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyEstimate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyEstimateRequiredCodeRule implements FrequencyEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a frequency estimate. */
export class FrequencyEstimateValidator {
  rules: FrequencyEstimateRule[];

  constructor(rules: FrequencyEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyEstimate): string[] {
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

  requireValid(item: FrequencyEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyEstimate[]): Map<string, string[]> {
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

export function defaultFrequencyEstimateValidator(): FrequencyEstimateValidator {
  return new FrequencyEstimateValidator(
    [
      new FrequencyEstimateGraceDaysRangeRule(80, 3600),
      new FrequencyEstimateAudienceIdLengthRule(255),
      new FrequencyEstimateLabelLengthRule(32),
      new FrequencyEstimateRequiredLabelRule("frequency estimate needs this field"),
      new FrequencyEstimateRequiredCodeRule("frequency estimate needs a value"),
    ],
  );
}
