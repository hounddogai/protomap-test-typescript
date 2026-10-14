import { AdaptiveLevelVariance } from "./adaptive-level-variance.js";

/** A rule a adaptive level variance must pass. Check returns its problems, or none. */
export interface AdaptiveLevelVarianceRule {
  check(item: AdaptiveLevelVariance): string[];
}

export class AdaptiveLevelVarianceLabelLengthRule implements AdaptiveLevelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveLevelVariance): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveLevelVarianceRequiredCodeRule implements AdaptiveLevelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLevelVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveLevelVarianceCodeLengthRule implements AdaptiveLevelVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveLevelVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveLevelVarianceRequiredCampaignRefRule implements AdaptiveLevelVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveLevelVariance): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveLevelVarianceRevisionRangeRule implements AdaptiveLevelVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveLevelVariance): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive level variance. */
export class AdaptiveLevelVarianceValidator {
  rules: AdaptiveLevelVarianceRule[];

  constructor(rules: AdaptiveLevelVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveLevelVariance): string[] {
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

  requireValid(item: AdaptiveLevelVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveLevelVariance[]): Map<string, string[]> {
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

export function defaultAdaptiveLevelVarianceValidator(): AdaptiveLevelVarianceValidator {
  return new AdaptiveLevelVarianceValidator(
    [
      new AdaptiveLevelVarianceLabelLengthRule(255),
      new AdaptiveLevelVarianceRequiredCodeRule("adaptive level variance needs this field"),
      new AdaptiveLevelVarianceCodeLengthRule(86400),
      new AdaptiveLevelVarianceRequiredCampaignRefRule("adaptive level variance needs an entry"),
      new AdaptiveLevelVarianceRevisionRangeRule(32, 120),
    ],
  );
}
