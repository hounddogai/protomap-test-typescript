import { FunnelDigest } from "./funnel-digest.js";

/** A rule a funnel digest must pass. Check returns its problems, or none. */
export interface FunnelDigestRule {
  check(item: FunnelDigest): string[];
}

export class FunnelDigestCampaignRefLengthRule implements FunnelDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelDigest): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelDigestOpenRateRangeRule implements FunnelDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelDigest): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FunnelDigestApprovedGuardRule implements FunnelDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FunnelDigest): string[] {
    if (item.approved && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class FunnelDigestRequiredCampaignRefRule implements FunnelDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelDigest): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelDigestExternalRefLengthRule implements FunnelDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelDigest): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a funnel digest. */
export class FunnelDigestValidator {
  rules: FunnelDigestRule[];

  constructor(rules: FunnelDigestRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelDigest): string[] {
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

  requireValid(item: FunnelDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelDigest[]): Map<string, string[]> {
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

export function defaultFunnelDigestValidator(): FunnelDigestValidator {
  return new FunnelDigestValidator(
    [
      new FunnelDigestCampaignRefLengthRule(255),
      new FunnelDigestOpenRateRangeRule(3.5, 441.5),
      new FunnelDigestApprovedGuardRule(4.8),
      new FunnelDigestRequiredCampaignRefRule("funnel digest needs an entry"),
      new FunnelDigestExternalRefLengthRule(86400),
    ],
  );
}
