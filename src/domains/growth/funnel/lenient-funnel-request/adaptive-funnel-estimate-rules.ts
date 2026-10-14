import { AdaptiveFunnelEstimate } from "./adaptive-funnel-estimate.js";

/** A rule a adaptive funnel estimate must pass. Check returns its problems, or none. */
export interface AdaptiveFunnelEstimateRule {
  check(item: AdaptiveFunnelEstimate): string[];
}

export class AdaptiveFunnelEstimateFloorValueRangeRule implements AdaptiveFunnelEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFunnelEstimate): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveFunnelEstimateRequiredCampaignRefRule implements AdaptiveFunnelEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFunnelEstimate): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFunnelEstimatePriorityRangeRule implements AdaptiveFunnelEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFunnelEstimate): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveFunnelEstimateEndsAtRangeRule implements AdaptiveFunnelEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFunnelEstimate): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveFunnelEstimateRequiredCodeRule implements AdaptiveFunnelEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFunnelEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFunnelEstimateCampaignRefLengthRule implements AdaptiveFunnelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFunnelEstimate): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive funnel estimate. */
export class AdaptiveFunnelEstimateValidator {
  rules: AdaptiveFunnelEstimateRule[];

  constructor(rules: AdaptiveFunnelEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFunnelEstimate): string[] {
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

  requireValid(item: AdaptiveFunnelEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFunnelEstimate[]): Map<string, string[]> {
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

export function defaultAdaptiveFunnelEstimateValidator(): AdaptiveFunnelEstimateValidator {
  return new AdaptiveFunnelEstimateValidator(
    [
      new AdaptiveFunnelEstimateFloorValueRangeRule(1.6, 3196.4),
      new AdaptiveFunnelEstimateRequiredCampaignRefRule("adaptive funnel estimate needs a value"),
      new AdaptiveFunnelEstimatePriorityRangeRule(16, 32),
      new AdaptiveFunnelEstimateEndsAtRangeRule(1000, 86400),
      new AdaptiveFunnelEstimateRequiredCodeRule("adaptive funnel estimate needs a value"),
      new AdaptiveFunnelEstimateCampaignRefLengthRule(120),
    ],
  );
}
