import { TieredCohortAdjustment } from "./tiered-cohort-adjustment.js";

/** A rule a tiered cohort adjustment must pass. Check returns its problems, or none. */
export interface TieredCohortAdjustmentRule {
  check(item: TieredCohortAdjustment): string[];
}

export class TieredCohortAdjustmentRequiredChannelRule implements TieredCohortAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCohortAdjustment): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TieredCohortAdjustmentQuantityRangeRule implements TieredCohortAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredCohortAdjustment): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredCohortAdjustmentRequiredCodeRule implements TieredCohortAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCohortAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredCohortAdjustmentRequiredDescriptionRule implements TieredCohortAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredCohortAdjustment): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered cohort adjustment. */
export class TieredCohortAdjustmentValidator {
  rules: TieredCohortAdjustmentRule[];

  constructor(rules: TieredCohortAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredCohortAdjustment): string[] {
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

  requireValid(item: TieredCohortAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredCohortAdjustment[]): Map<string, string[]> {
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

export function defaultTieredCohortAdjustmentValidator(): TieredCohortAdjustmentValidator {
  return new TieredCohortAdjustmentValidator(
    [
      new TieredCohortAdjustmentRequiredChannelRule("tiered cohort adjustment needs this field"),
      new TieredCohortAdjustmentQuantityRangeRule(80, 86400),
      new TieredCohortAdjustmentRequiredCodeRule("tiered cohort adjustment needs a value"),
      new TieredCohortAdjustmentRequiredDescriptionRule("tiered cohort adjustment needs an entry"),
    ],
  );
}
