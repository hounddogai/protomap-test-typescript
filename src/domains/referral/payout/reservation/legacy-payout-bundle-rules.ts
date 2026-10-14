import { LegacyPayoutBundle } from "./legacy-payout-bundle.js";

/** A rule a legacy payout bundle must pass. Check returns its problems, or none. */
export interface LegacyPayoutBundleRule {
  check(item: LegacyPayoutBundle): string[];
}

export class LegacyPayoutBundleCampaignRefLengthRule implements LegacyPayoutBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPayoutBundle): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPayoutBundleCodeLengthRule implements LegacyPayoutBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPayoutBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPayoutBundleRequiredCodeRule implements LegacyPayoutBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPayoutBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPayoutBundleGraceDaysRangeRule implements LegacyPayoutBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyPayoutBundle): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyPayoutBundleLabelLengthRule implements LegacyPayoutBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPayoutBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPayoutBundleRequiredCampaignRefRule implements LegacyPayoutBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPayoutBundle): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy payout bundle. */
export class LegacyPayoutBundleValidator {
  rules: LegacyPayoutBundleRule[];

  constructor(rules: LegacyPayoutBundleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPayoutBundle): string[] {
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

  requireValid(item: LegacyPayoutBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPayoutBundle[]): Map<string, string[]> {
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

export function defaultLegacyPayoutBundleValidator(): LegacyPayoutBundleValidator {
  return new LegacyPayoutBundleValidator(
    [
      new LegacyPayoutBundleCampaignRefLengthRule(80),
      new LegacyPayoutBundleCodeLengthRule(64),
      new LegacyPayoutBundleRequiredCodeRule("legacy payout bundle needs a value"),
      new LegacyPayoutBundleGraceDaysRangeRule(1000, 3600),
      new LegacyPayoutBundleLabelLengthRule(64),
      new LegacyPayoutBundleRequiredCampaignRefRule("legacy payout bundle needs a value"),
    ],
  );
}
