import { RegionalExitRuleBaseline } from "./regional-exit-rule-baseline.js";

/** A rule a regional exit rule baseline must pass. Check returns its problems, or none. */
export interface RegionalExitRuleBaselineRule {
  check(item: RegionalExitRuleBaseline): string[];
}

export class RegionalExitRuleBaselineCodeLengthRule implements RegionalExitRuleBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalExitRuleBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalExitRuleBaselineBatchSizeRangeRule implements RegionalExitRuleBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalExitRuleBaseline): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalExitRuleBaselineAudienceIdLengthRule implements RegionalExitRuleBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalExitRuleBaseline): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional exit rule baseline. */
export class RegionalExitRuleBaselineValidator {
  rules: RegionalExitRuleBaselineRule[];

  constructor(rules: RegionalExitRuleBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalExitRuleBaseline): string[] {
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

  requireValid(item: RegionalExitRuleBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalExitRuleBaseline[]): Map<string, string[]> {
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

export function defaultRegionalExitRuleBaselineValidator(): RegionalExitRuleBaselineValidator {
  return new RegionalExitRuleBaselineValidator(
    [
      new RegionalExitRuleBaselineCodeLengthRule(64),
      new RegionalExitRuleBaselineBatchSizeRangeRule(120, 255),
      new RegionalExitRuleBaselineAudienceIdLengthRule(64),
    ],
  );
}
