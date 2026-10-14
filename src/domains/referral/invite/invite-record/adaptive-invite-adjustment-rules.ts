import { AdaptiveInviteAdjustment } from "./adaptive-invite-adjustment.js";

/** A rule a adaptive invite adjustment must pass. Check returns its problems, or none. */
export interface AdaptiveInviteAdjustmentRule {
  check(item: AdaptiveInviteAdjustment): string[];
}

export class AdaptiveInviteAdjustmentCurrencyLengthRule implements AdaptiveInviteAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveInviteAdjustment): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveInviteAdjustmentThresholdRangeRule implements AdaptiveInviteAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveInviteAdjustment): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveInviteAdjustmentNameLengthRule implements AdaptiveInviteAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveInviteAdjustment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveInviteAdjustmentOpenRateRangeRule implements AdaptiveInviteAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveInviteAdjustment): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveInviteAdjustmentRequiredCurrencyRule implements AdaptiveInviteAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveInviteAdjustment): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive invite adjustment. */
export class AdaptiveInviteAdjustmentValidator {
  rules: AdaptiveInviteAdjustmentRule[];

  constructor(rules: AdaptiveInviteAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveInviteAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveInviteAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveInviteAdjustment[]): Map<string, string[]> {
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

export function defaultAdaptiveInviteAdjustmentValidator(): AdaptiveInviteAdjustmentValidator {
  return new AdaptiveInviteAdjustmentValidator(
    [
      new AdaptiveInviteAdjustmentCurrencyLengthRule(80),
      new AdaptiveInviteAdjustmentThresholdRangeRule(6.1, 3114.2),
      new AdaptiveInviteAdjustmentNameLengthRule(255),
      new AdaptiveInviteAdjustmentOpenRateRangeRule(3.8, 2883.8),
      new AdaptiveInviteAdjustmentRequiredCurrencyRule("adaptive invite adjustment needs this field"),
    ],
  );
}
