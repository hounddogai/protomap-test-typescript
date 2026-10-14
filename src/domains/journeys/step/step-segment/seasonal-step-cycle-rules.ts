import { SeasonalStepCycle } from "./seasonal-step-cycle.js";

/** A rule a seasonal step cycle must pass. Check returns its problems, or none. */
export interface SeasonalStepCycleRule {
  check(item: SeasonalStepCycle): string[];
}

export class SeasonalStepCycleRequiredCampaignRefRule implements SeasonalStepCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalStepCycle): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalStepCycleRequiredChecksumRule implements SeasonalStepCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalStepCycle): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalStepCycleImpressionsRangeRule implements SeasonalStepCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalStepCycle): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalStepCycleLabelLengthRule implements SeasonalStepCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalStepCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal step cycle. */
export class SeasonalStepCycleValidator {
  rules: SeasonalStepCycleRule[];

  constructor(rules: SeasonalStepCycleRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalStepCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalStepCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalStepCycle[]): Map<string, string[]> {
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

export function defaultSeasonalStepCycleValidator(): SeasonalStepCycleValidator {
  return new SeasonalStepCycleValidator(
    [
      new SeasonalStepCycleRequiredCampaignRefRule("seasonal step cycle needs this field"),
      new SeasonalStepCycleRequiredChecksumRule("seasonal step cycle needs a value"),
      new SeasonalStepCycleImpressionsRangeRule(32, 80),
      new SeasonalStepCycleLabelLengthRule(1000),
    ],
  );
}
