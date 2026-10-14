import { TieredMacroAgreement } from "./tiered-macro-agreement.js";

/** A rule a tiered macro agreement must pass. Check returns its problems, or none. */
export interface TieredMacroAgreementRule {
  check(item: TieredMacroAgreement): string[];
}

export class TieredMacroAgreementUpdatedAtRangeRule implements TieredMacroAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredMacroAgreement): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredMacroAgreementThresholdRangeRule implements TieredMacroAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredMacroAgreement): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredMacroAgreementRateRangeRule implements TieredMacroAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredMacroAgreement): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredMacroAgreementTitleLengthRule implements TieredMacroAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredMacroAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredMacroAgreementCodeLengthRule implements TieredMacroAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredMacroAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredMacroAgreementWindowDaysRangeRule implements TieredMacroAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredMacroAgreement): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a tiered macro agreement. */
export class TieredMacroAgreementValidator {
  rules: TieredMacroAgreementRule[];

  constructor(rules: TieredMacroAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: TieredMacroAgreement): string[] {
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

  requireValid(item: TieredMacroAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredMacroAgreement[]): Map<string, string[]> {
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

export function defaultTieredMacroAgreementValidator(): TieredMacroAgreementValidator {
  return new TieredMacroAgreementValidator(
    [
      new TieredMacroAgreementUpdatedAtRangeRule(255, 3600),
      new TieredMacroAgreementThresholdRangeRule(1.6, 4270.8),
      new TieredMacroAgreementRateRangeRule(4.5, 2472),
      new TieredMacroAgreementTitleLengthRule(255),
      new TieredMacroAgreementCodeLengthRule(32),
      new TieredMacroAgreementWindowDaysRangeRule(16, 120),
    ],
  );
}
