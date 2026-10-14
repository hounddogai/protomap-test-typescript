import { ComplaintTier } from "./complaint-tier.js";

/** A rule a complaint tier must pass. Check returns its problems, or none. */
export interface ComplaintTierRule {
  check(item: ComplaintTier): string[];
}

export class ComplaintTierRequiredExternalRefRule implements ComplaintTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintTier): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintTierWindowDaysRangeRule implements ComplaintTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintTier): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintTierTitleLengthRule implements ComplaintTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintTierCodeLengthRule implements ComplaintTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a complaint tier. */
export class ComplaintTierValidator {
  rules: ComplaintTierRule[];

  constructor(rules: ComplaintTierRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintTier[]): Map<string, string[]> {
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

export function defaultComplaintTierValidator(): ComplaintTierValidator {
  return new ComplaintTierValidator(
    [
      new ComplaintTierRequiredExternalRefRule("complaint tier needs an entry"),
      new ComplaintTierWindowDaysRangeRule(255, 3600),
      new ComplaintTierTitleLengthRule(120),
      new ComplaintTierCodeLengthRule(255),
    ],
  );
}
