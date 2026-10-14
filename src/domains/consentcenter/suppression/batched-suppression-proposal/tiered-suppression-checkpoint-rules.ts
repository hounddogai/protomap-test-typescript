import { TieredSuppressionCheckpoint } from "./tiered-suppression-checkpoint.js";

/** A rule a tiered suppression checkpoint must pass. Check returns its problems, or none. */
export interface TieredSuppressionCheckpointRule {
  check(item: TieredSuppressionCheckpoint): string[];
}

export class TieredSuppressionCheckpointRequiredNameRule implements TieredSuppressionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSuppressionCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSuppressionCheckpointRequiredCampaignRefRule implements TieredSuppressionCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSuppressionCheckpoint): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSuppressionCheckpointConversionRateRangeRule implements TieredSuppressionCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredSuppressionCheckpoint): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredSuppressionCheckpointCampaignRefLengthRule implements TieredSuppressionCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSuppressionCheckpoint): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered suppression checkpoint. */
export class TieredSuppressionCheckpointValidator {
  rules: TieredSuppressionCheckpointRule[];

  constructor(rules: TieredSuppressionCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSuppressionCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredSuppressionCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSuppressionCheckpoint[]): Map<string, string[]> {
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

export function defaultTieredSuppressionCheckpointValidator(): TieredSuppressionCheckpointValidator {
  return new TieredSuppressionCheckpointValidator(
    [
      new TieredSuppressionCheckpointRequiredNameRule("tiered suppression checkpoint needs an entry"),
      new TieredSuppressionCheckpointRequiredCampaignRefRule("tiered suppression checkpoint needs an entry"),
      new TieredSuppressionCheckpointConversionRateRangeRule(7.9, 3566),
      new TieredSuppressionCheckpointCampaignRefLengthRule(120),
    ],
  );
}
