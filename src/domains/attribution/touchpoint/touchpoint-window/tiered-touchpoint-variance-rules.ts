import * as text from "../../../../kit/text.js";
import { TieredTouchpointVariance } from "./tiered-touchpoint-variance.js";

/** A rule a tiered touchpoint variance must pass. Check returns its problems, or none. */
export interface TieredTouchpointVarianceRule {
  check(item: TieredTouchpointVariance): string[];
}

export class TieredTouchpointVarianceCodeLengthRule implements TieredTouchpointVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTouchpointVarianceAllowedCampaignRefRule implements TieredTouchpointVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredTouchpointVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is blocked`];
    return [];
  }
}

export class TieredTouchpointVarianceAmountRangeRule implements TieredTouchpointVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredTouchpointVariance): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredTouchpointVarianceChannelLengthRule implements TieredTouchpointVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointVariance): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered touchpoint variance. */
export class TieredTouchpointVarianceValidator {
  rules: TieredTouchpointVarianceRule[];

  constructor(rules: TieredTouchpointVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTouchpointVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredTouchpointVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTouchpointVariance[]): Map<string, string[]> {
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

export function defaultTieredTouchpointVarianceValidator(): TieredTouchpointVarianceValidator {
  return new TieredTouchpointVarianceValidator(
    [
      new TieredTouchpointVarianceCodeLengthRule(80),
      new TieredTouchpointVarianceAllowedCampaignRefRule([]),
      new TieredTouchpointVarianceAmountRangeRule(5.6, 2997.7),
      new TieredTouchpointVarianceChannelLengthRule(120),
    ],
  );
}
