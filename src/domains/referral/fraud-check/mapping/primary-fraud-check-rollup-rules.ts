import * as text from "../../../../kit/text.js";
import { PrimaryFraudCheckRollup } from "./primary-fraud-check-rollup.js";

/** A rule a primary fraud check rollup must pass. Check returns its problems, or none. */
export interface PrimaryFraudCheckRollupRule {
  check(item: PrimaryFraudCheckRollup): string[];
}

export class PrimaryFraudCheckRollupLocaleLengthRule implements PrimaryFraudCheckRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFraudCheckRollup): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFraudCheckRollupAllowedCampaignRefRule implements PrimaryFraudCheckRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryFraudCheckRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is above maximum`];
    return [];
  }
}

export class PrimaryFraudCheckRollupLabelLengthRule implements PrimaryFraudCheckRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFraudCheckRollup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFraudCheckRollupRequiredCodeRule implements PrimaryFraudCheckRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFraudCheckRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFraudCheckRollupVersionRangeRule implements PrimaryFraudCheckRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryFraudCheckRollup): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary fraud check rollup. */
export class PrimaryFraudCheckRollupValidator {
  rules: PrimaryFraudCheckRollupRule[];

  constructor(rules: PrimaryFraudCheckRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFraudCheckRollup): string[] {
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

  requireValid(item: PrimaryFraudCheckRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFraudCheckRollup[]): Map<string, string[]> {
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

export function defaultPrimaryFraudCheckRollupValidator(): PrimaryFraudCheckRollupValidator {
  return new PrimaryFraudCheckRollupValidator(
    [
      new PrimaryFraudCheckRollupLocaleLengthRule(120),
      new PrimaryFraudCheckRollupAllowedCampaignRefRule(["tiered"]),
      new PrimaryFraudCheckRollupLabelLengthRule(80),
      new PrimaryFraudCheckRollupRequiredCodeRule("primary fraud check rollup needs this field"),
      new PrimaryFraudCheckRollupVersionRangeRule(64, 3600),
    ],
  );
}
