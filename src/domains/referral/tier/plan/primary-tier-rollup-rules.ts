import { PrimaryTierRollup } from "./primary-tier-rollup.js";

/** A rule a primary tier rollup must pass. Check returns its problems, or none. */
export interface PrimaryTierRollupRule {
  check(item: PrimaryTierRollup): string[];
}

export class PrimaryTierRollupCodePrefixRule implements PrimaryTierRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryTierRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryTierRollupCampaignRefLengthRule implements PrimaryTierRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTierRollup): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryTierRollupRegionLengthRule implements PrimaryTierRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTierRollup): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary tier rollup. */
export class PrimaryTierRollupValidator {
  rules: PrimaryTierRollupRule[];

  constructor(rules: PrimaryTierRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTierRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryTierRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTierRollup[]): Map<string, string[]> {
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

export function defaultPrimaryTierRollupValidator(): PrimaryTierRollupValidator {
  return new PrimaryTierRollupValidator(
    [
      new PrimaryTierRollupCodePrefixRule("X"),
      new PrimaryTierRollupCampaignRefLengthRule(16),
      new PrimaryTierRollupRegionLengthRule(86400),
    ],
  );
}
