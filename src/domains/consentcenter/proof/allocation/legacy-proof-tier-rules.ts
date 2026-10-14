import { LegacyProofTier } from "./legacy-proof-tier.js";

/** A rule a legacy proof tier must pass. Check returns its problems, or none. */
export interface LegacyProofTierRule {
  check(item: LegacyProofTier): string[];
}

export class LegacyProofTierBidRangeRule implements LegacyProofTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyProofTier): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyProofTierCodeLengthRule implements LegacyProofTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyProofTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyProofTierRequiredLabelRule implements LegacyProofTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyProofTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyProofTierRequiredSummaryRule implements LegacyProofTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyProofTier): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy proof tier. */
export class LegacyProofTierValidator {
  rules: LegacyProofTierRule[];

  constructor(rules: LegacyProofTierRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyProofTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyProofTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyProofTier[]): Map<string, string[]> {
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

export function defaultLegacyProofTierValidator(): LegacyProofTierValidator {
  return new LegacyProofTierValidator(
    [
      new LegacyProofTierBidRangeRule(9.9, 3082.1),
      new LegacyProofTierCodeLengthRule(1000),
      new LegacyProofTierRequiredLabelRule("legacy proof tier needs this field"),
      new LegacyProofTierRequiredSummaryRule("legacy proof tier needs a value"),
    ],
  );
}
