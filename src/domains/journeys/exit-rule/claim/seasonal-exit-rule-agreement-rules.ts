import { SeasonalExitRuleAgreement } from "./seasonal-exit-rule-agreement.js";

/** A rule a seasonal exit rule agreement must pass. Check returns its problems, or none. */
export interface SeasonalExitRuleAgreementRule {
  check(item: SeasonalExitRuleAgreement): string[];
}

export class SeasonalExitRuleAgreementLimitRangeRule implements SeasonalExitRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalExitRuleAgreement): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalExitRuleAgreementFloorValueRangeRule implements SeasonalExitRuleAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalExitRuleAgreement): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalExitRuleAgreementTitleLengthRule implements SeasonalExitRuleAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalExitRuleAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal exit rule agreement. */
export class SeasonalExitRuleAgreementValidator {
  rules: SeasonalExitRuleAgreementRule[];

  constructor(rules: SeasonalExitRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalExitRuleAgreement): string[] {
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

  requireValid(item: SeasonalExitRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalExitRuleAgreement[]): Map<string, string[]> {
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

export function defaultSeasonalExitRuleAgreementValidator(): SeasonalExitRuleAgreementValidator {
  return new SeasonalExitRuleAgreementValidator(
    [
      new SeasonalExitRuleAgreementLimitRangeRule(120, 3600),
      new SeasonalExitRuleAgreementFloorValueRangeRule(2.5, 2014.5),
      new SeasonalExitRuleAgreementTitleLengthRule(64),
    ],
  );
}
