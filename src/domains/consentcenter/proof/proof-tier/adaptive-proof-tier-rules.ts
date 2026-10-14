import { AdaptiveProofTier } from "./adaptive-proof-tier.js";

/** A rule a adaptive proof tier must pass. Check returns its problems, or none. */
export interface AdaptiveProofTierRule {
  check(item: AdaptiveProofTier): string[];
}

export class AdaptiveProofTierRequiredCodeRule implements AdaptiveProofTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveProofTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveProofTierRequiredAudienceIdRule implements AdaptiveProofTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveProofTier): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveProofTierCodeLengthRule implements AdaptiveProofTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveProofTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveProofTierDurationMinutesRangeRule implements AdaptiveProofTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveProofTier): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveProofTierLabelLengthRule implements AdaptiveProofTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveProofTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveProofTierWeightRangeRule implements AdaptiveProofTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveProofTier): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive proof tier. */
export class AdaptiveProofTierValidator {
  rules: AdaptiveProofTierRule[];

  constructor(rules: AdaptiveProofTierRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveProofTier): string[] {
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

  requireValid(item: AdaptiveProofTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveProofTier[]): Map<string, string[]> {
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

export function defaultAdaptiveProofTierValidator(): AdaptiveProofTierValidator {
  return new AdaptiveProofTierValidator(
    [
      new AdaptiveProofTierRequiredCodeRule("adaptive proof tier needs a value"),
      new AdaptiveProofTierRequiredAudienceIdRule("adaptive proof tier needs this field"),
      new AdaptiveProofTierCodeLengthRule(1000),
      new AdaptiveProofTierDurationMinutesRangeRule(86400, 86400),
      new AdaptiveProofTierLabelLengthRule(80),
      new AdaptiveProofTierWeightRangeRule(9, 3786.1),
    ],
  );
}
