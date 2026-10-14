import { SeasonalInsightBatch } from "./seasonal-insight-batch.js";

/** A rule a seasonal insight batch must pass. Check returns its problems, or none. */
export interface SeasonalInsightBatchRule {
  check(item: SeasonalInsightBatch): string[];
}

export class SeasonalInsightBatchCodePrefixRule implements SeasonalInsightBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalInsightBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalInsightBatchMarginRangeRule implements SeasonalInsightBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalInsightBatch): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalInsightBatchEndsAtRangeRule implements SeasonalInsightBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalInsightBatch): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SeasonalInsightBatchRequiredNameRule implements SeasonalInsightBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalInsightBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal insight batch. */
export class SeasonalInsightBatchValidator {
  rules: SeasonalInsightBatchRule[];

  constructor(rules: SeasonalInsightBatchRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalInsightBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalInsightBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalInsightBatch[]): Map<string, string[]> {
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

export function defaultSeasonalInsightBatchValidator(): SeasonalInsightBatchValidator {
  return new SeasonalInsightBatchValidator(
    [
      new SeasonalInsightBatchCodePrefixRule("ACM"),
      new SeasonalInsightBatchMarginRangeRule(0.5, 898.4),
      new SeasonalInsightBatchEndsAtRangeRule(64, 255),
      new SeasonalInsightBatchRequiredNameRule("seasonal insight batch needs an entry"),
    ],
  );
}
