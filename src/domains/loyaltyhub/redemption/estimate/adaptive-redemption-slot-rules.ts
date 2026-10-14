import * as text from "../../../../kit/text.js";
import { AdaptiveRedemptionSlot } from "./adaptive-redemption-slot.js";

/** A rule a adaptive redemption slot must pass. Check returns its problems, or none. */
export interface AdaptiveRedemptionSlotRule {
  check(item: AdaptiveRedemptionSlot): string[];
}

export class AdaptiveRedemptionSlotTitleLengthRule implements AdaptiveRedemptionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRedemptionSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveRedemptionSlotAllowedSummaryRule implements AdaptiveRedemptionSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveRedemptionSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is stale`];
    return [];
  }
}

export class AdaptiveRedemptionSlotScoreRangeRule implements AdaptiveRedemptionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveRedemptionSlot): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveRedemptionSlotDiscountRangeRule implements AdaptiveRedemptionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveRedemptionSlot): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveRedemptionSlotSummaryLengthRule implements AdaptiveRedemptionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRedemptionSlot): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive redemption slot. */
export class AdaptiveRedemptionSlotValidator {
  rules: AdaptiveRedemptionSlotRule[];

  constructor(rules: AdaptiveRedemptionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveRedemptionSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveRedemptionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveRedemptionSlot[]): Map<string, string[]> {
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

export function defaultAdaptiveRedemptionSlotValidator(): AdaptiveRedemptionSlotValidator {
  return new AdaptiveRedemptionSlotValidator(
    [
      new AdaptiveRedemptionSlotTitleLengthRule(32),
      new AdaptiveRedemptionSlotAllowedSummaryRule(["manual", "pending", "weighted"]),
      new AdaptiveRedemptionSlotScoreRangeRule(8.7, 1280.5),
      new AdaptiveRedemptionSlotDiscountRangeRule(8.2, 2624.5),
      new AdaptiveRedemptionSlotSummaryLengthRule(3600),
    ],
  );
}
