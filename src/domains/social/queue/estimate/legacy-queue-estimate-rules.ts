import { LegacyQueueEstimate } from "./legacy-queue-estimate.js";

/** A rule a legacy queue estimate must pass. Check returns its problems, or none. */
export interface LegacyQueueEstimateRule {
  check(item: LegacyQueueEstimate): string[];
}

export class LegacyQueueEstimateCodePrefixRule implements LegacyQueueEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyQueueEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyQueueEstimateRateRangeRule implements LegacyQueueEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyQueueEstimate): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyQueueEstimateRequiredLabelRule implements LegacyQueueEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyQueueEstimate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy queue estimate. */
export class LegacyQueueEstimateValidator {
  rules: LegacyQueueEstimateRule[];

  constructor(rules: LegacyQueueEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyQueueEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyQueueEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyQueueEstimate[]): Map<string, string[]> {
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

export function defaultLegacyQueueEstimateValidator(): LegacyQueueEstimateValidator {
  return new LegacyQueueEstimateValidator(
    [
      new LegacyQueueEstimateCodePrefixRule("OPS"),
      new LegacyQueueEstimateRateRangeRule(0.6, 1701.3),
      new LegacyQueueEstimateRequiredLabelRule("legacy queue estimate needs an entry"),
    ],
  );
}
