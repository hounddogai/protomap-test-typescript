import { SeasonalRewardRollup } from "./seasonal-reward-rollup.js";

/** A rule a seasonal reward rollup must pass. Check returns its problems, or none. */
export interface SeasonalRewardRollupRule {
  check(item: SeasonalRewardRollup): string[];
}

export class SeasonalRewardRollupRequiredLabelRule implements SeasonalRewardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalRewardRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalRewardRollupBatchSizeRangeRule implements SeasonalRewardRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalRewardRollup): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalRewardRollupCodeLengthRule implements SeasonalRewardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalRewardRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal reward rollup. */
export class SeasonalRewardRollupValidator {
  rules: SeasonalRewardRollupRule[];

  constructor(rules: SeasonalRewardRollupRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalRewardRollup): string[] {
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

  requireValid(item: SeasonalRewardRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalRewardRollup[]): Map<string, string[]> {
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

export function defaultSeasonalRewardRollupValidator(): SeasonalRewardRollupValidator {
  return new SeasonalRewardRollupValidator(
    [
      new SeasonalRewardRollupRequiredLabelRule("seasonal reward rollup needs this field"),
      new SeasonalRewardRollupBatchSizeRangeRule(120, 1000),
      new SeasonalRewardRollupCodeLengthRule(16),
    ],
  );
}
