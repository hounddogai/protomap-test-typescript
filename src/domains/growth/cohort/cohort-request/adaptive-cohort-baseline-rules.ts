import { AdaptiveCohortBaseline } from "./adaptive-cohort-baseline.js";

/** A rule a adaptive cohort baseline must pass. Check returns its problems, or none. */
export interface AdaptiveCohortBaselineRule {
  check(item: AdaptiveCohortBaseline): string[];
}

export class AdaptiveCohortBaselineRequiredCampaignRefRule implements AdaptiveCohortBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCohortBaseline): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCohortBaselineNameLengthRule implements AdaptiveCohortBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCohortBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveCohortBaselineQuantityRangeRule implements AdaptiveCohortBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCohortBaseline): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveCohortBaselineCodePrefixRule implements AdaptiveCohortBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveCohortBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveCohortBaselineFloorValueRangeRule implements AdaptiveCohortBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCohortBaseline): string[] {
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

/** Runs every rule of a adaptive cohort baseline. */
export class AdaptiveCohortBaselineValidator {
  rules: AdaptiveCohortBaselineRule[];

  constructor(rules: AdaptiveCohortBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCohortBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveCohortBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCohortBaseline[]): Map<string, string[]> {
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

export function defaultAdaptiveCohortBaselineValidator(): AdaptiveCohortBaselineValidator {
  return new AdaptiveCohortBaselineValidator(
    [
      new AdaptiveCohortBaselineRequiredCampaignRefRule("adaptive cohort baseline needs an entry"),
      new AdaptiveCohortBaselineNameLengthRule(255),
      new AdaptiveCohortBaselineQuantityRangeRule(16, 86400),
      new AdaptiveCohortBaselineCodePrefixRule("OPS"),
      new AdaptiveCohortBaselineFloorValueRangeRule(6.3, 642.3),
    ],
  );
}
