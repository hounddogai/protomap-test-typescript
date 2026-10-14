import { LenientMacroEstimate } from "./lenient-macro-estimate.js";

/** A rule a lenient macro estimate must pass. Check returns its problems, or none. */
export interface LenientMacroEstimateRule {
  check(item: LenientMacroEstimate): string[];
}

export class LenientMacroEstimateCampaignRefLengthRule implements LenientMacroEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientMacroEstimate): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientMacroEstimateCapacityRangeRule implements LenientMacroEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientMacroEstimate): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientMacroEstimateNameLengthRule implements LenientMacroEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientMacroEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientMacroEstimateCodeLengthRule implements LenientMacroEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientMacroEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientMacroEstimateWeightRangeRule implements LenientMacroEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientMacroEstimate): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient macro estimate. */
export class LenientMacroEstimateValidator {
  rules: LenientMacroEstimateRule[];

  constructor(rules: LenientMacroEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: LenientMacroEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientMacroEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientMacroEstimate[]): Map<string, string[]> {
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

export function defaultLenientMacroEstimateValidator(): LenientMacroEstimateValidator {
  return new LenientMacroEstimateValidator(
    [
      new LenientMacroEstimateCampaignRefLengthRule(1000),
      new LenientMacroEstimateCapacityRangeRule(80, 3600),
      new LenientMacroEstimateNameLengthRule(32),
      new LenientMacroEstimateCodeLengthRule(120),
      new LenientMacroEstimateWeightRangeRule(6.8, 2490.6),
    ],
  );
}
