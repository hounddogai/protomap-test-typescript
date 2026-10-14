import { CappedCreditThreshold } from "./capped-credit-threshold.js";

/** A rule a capped credit threshold must pass. Check returns its problems, or none. */
export interface CappedCreditThresholdRule {
  check(item: CappedCreditThreshold): string[];
}

export class CappedCreditThresholdFloorValueRangeRule implements CappedCreditThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCreditThreshold): string[] {
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

export class CappedCreditThresholdRequiredCampaignRefRule implements CappedCreditThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreditThreshold): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCreditThresholdRequiredTitleRule implements CappedCreditThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreditThreshold): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCreditThresholdCodePrefixRule implements CappedCreditThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedCreditThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedCreditThresholdGraceDaysRangeRule implements CappedCreditThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCreditThreshold): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped credit threshold. */
export class CappedCreditThresholdValidator {
  rules: CappedCreditThresholdRule[];

  constructor(rules: CappedCreditThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCreditThreshold): string[] {
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

  requireValid(item: CappedCreditThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCreditThreshold[]): Map<string, string[]> {
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

export function defaultCappedCreditThresholdValidator(): CappedCreditThresholdValidator {
  return new CappedCreditThresholdValidator(
    [
      new CappedCreditThresholdFloorValueRangeRule(0.4, 3055.4),
      new CappedCreditThresholdRequiredCampaignRefRule("capped credit threshold needs a value"),
      new CappedCreditThresholdRequiredTitleRule("capped credit threshold needs an entry"),
      new CappedCreditThresholdCodePrefixRule("OPS"),
      new CappedCreditThresholdGraceDaysRangeRule(16, 120),
    ],
  );
}
