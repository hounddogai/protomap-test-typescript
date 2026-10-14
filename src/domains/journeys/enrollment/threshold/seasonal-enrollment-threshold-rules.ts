import { SeasonalEnrollmentThreshold } from "./seasonal-enrollment-threshold.js";

/** A rule a seasonal enrollment threshold must pass. Check returns its problems, or none. */
export interface SeasonalEnrollmentThresholdRule {
  check(item: SeasonalEnrollmentThreshold): string[];
}

export class SeasonalEnrollmentThresholdRequiredRegionRule implements SeasonalEnrollmentThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEnrollmentThreshold): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalEnrollmentThresholdLabelLengthRule implements SeasonalEnrollmentThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalEnrollmentThreshold): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalEnrollmentThresholdRequiredLabelRule implements SeasonalEnrollmentThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEnrollmentThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal enrollment threshold. */
export class SeasonalEnrollmentThresholdValidator {
  rules: SeasonalEnrollmentThresholdRule[];

  constructor(rules: SeasonalEnrollmentThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalEnrollmentThreshold): string[] {
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

  requireValid(item: SeasonalEnrollmentThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalEnrollmentThreshold[]): Map<string, string[]> {
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

export function defaultSeasonalEnrollmentThresholdValidator(): SeasonalEnrollmentThresholdValidator {
  return new SeasonalEnrollmentThresholdValidator(
    [
      new SeasonalEnrollmentThresholdRequiredRegionRule("seasonal enrollment threshold needs this field"),
      new SeasonalEnrollmentThresholdLabelLengthRule(1000),
      new SeasonalEnrollmentThresholdRequiredLabelRule("seasonal enrollment threshold needs this field"),
    ],
  );
}
