import { RollingProofTier } from "./rolling-proof-tier.js";

/** A rule a rolling proof tier must pass. Check returns its problems, or none. */
export interface RollingProofTierRule {
  check(item: RollingProofTier): string[];
}

export class RollingProofTierRateRangeRule implements RollingProofTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingProofTier): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingProofTierCampaignRefLengthRule implements RollingProofTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingProofTier): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingProofTierTitleLengthRule implements RollingProofTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingProofTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingProofTierCodePrefixRule implements RollingProofTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingProofTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingProofTierRequiredCodeRule implements RollingProofTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingProofTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling proof tier. */
export class RollingProofTierValidator {
  rules: RollingProofTierRule[];

  constructor(rules: RollingProofTierRule[]) {
    this.rules = rules;
  }

  validate(item: RollingProofTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingProofTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingProofTier[]): Map<string, string[]> {
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

export function defaultRollingProofTierValidator(): RollingProofTierValidator {
  return new RollingProofTierValidator(
    [
      new RollingProofTierRateRangeRule(3.2, 4074.5),
      new RollingProofTierCampaignRefLengthRule(16),
      new RollingProofTierTitleLengthRule(64),
      new RollingProofTierCodePrefixRule("OPS"),
      new RollingProofTierRequiredCodeRule("rolling proof tier needs a value"),
    ],
  );
}
