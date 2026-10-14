import { TieredJourneyDigest } from "./tiered-journey-digest.js";

/** A rule a tiered journey digest must pass. Check returns its problems, or none. */
export interface TieredJourneyDigestRule {
  check(item: TieredJourneyDigest): string[];
}

export class TieredJourneyDigestRequiredCampaignRefRule implements TieredJourneyDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredJourneyDigest): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class TieredJourneyDigestCodePrefixRule implements TieredJourneyDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredJourneyDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredJourneyDigestCampaignRefLengthRule implements TieredJourneyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredJourneyDigest): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered journey digest. */
export class TieredJourneyDigestValidator {
  rules: TieredJourneyDigestRule[];

  constructor(rules: TieredJourneyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredJourneyDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredJourneyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredJourneyDigest[]): Map<string, string[]> {
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

export function defaultTieredJourneyDigestValidator(): TieredJourneyDigestValidator {
  return new TieredJourneyDigestValidator(
    [
      new TieredJourneyDigestRequiredCampaignRefRule("tiered journey digest needs a value"),
      new TieredJourneyDigestCodePrefixRule("ACM"),
      new TieredJourneyDigestCampaignRefLengthRule(255),
    ],
  );
}
