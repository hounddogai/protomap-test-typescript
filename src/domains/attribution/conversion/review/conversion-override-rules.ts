import { ConversionOverride } from "./conversion-override.js";

/** A rule a conversion override must pass. Check returns its problems, or none. */
export interface ConversionOverrideRule {
  check(item: ConversionOverride): string[];
}

export class ConversionOverrideRequiredCodeRule implements ConversionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionOverrideRegionLengthRule implements ConversionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionOverride): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionOverrideGraceDaysRangeRule implements ConversionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionOverride): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionOverrideDiscountRangeRule implements ConversionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionOverride): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ConversionOverrideRequiredRegionRule implements ConversionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionOverride): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion override. */
export class ConversionOverrideValidator {
  rules: ConversionOverrideRule[];

  constructor(rules: ConversionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionOverride[]): Map<string, string[]> {
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

export function defaultConversionOverrideValidator(): ConversionOverrideValidator {
  return new ConversionOverrideValidator(
    [
      new ConversionOverrideRequiredCodeRule("conversion override needs this field"),
      new ConversionOverrideRegionLengthRule(16),
      new ConversionOverrideGraceDaysRangeRule(64, 120),
      new ConversionOverrideDiscountRangeRule(1, 366.1),
      new ConversionOverrideRequiredRegionRule("conversion override needs this field"),
    ],
  );
}
