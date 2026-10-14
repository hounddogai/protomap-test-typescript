import { TierRollup } from "./tier-rollup.js";

/** A rule a tier rollup must pass. Check returns its problems, or none. */
export interface TierRollupRule {
  check(item: TierRollup): string[];
}

export class TierRollupRequiredLabelRule implements TierRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TierRollupOpenRateRangeRule implements TierRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TierRollup): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TierRollupRequiredNameRule implements TierRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TierRollupNameLengthRule implements TierRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierRollupLabelLengthRule implements TierRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier rollup. */
export class TierRollupValidator {
  rules: TierRollupRule[];

  constructor(rules: TierRollupRule[]) {
    this.rules = rules;
  }

  validate(item: TierRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TierRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierRollup[]): Map<string, string[]> {
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

export function defaultTierRollupValidator(): TierRollupValidator {
  return new TierRollupValidator(
    [
      new TierRollupRequiredLabelRule("tier rollup needs this field"),
      new TierRollupOpenRateRangeRule(0.8, 821.9),
      new TierRollupRequiredNameRule("tier rollup needs this field"),
      new TierRollupNameLengthRule(16),
      new TierRollupLabelLengthRule(255),
    ],
  );
}
