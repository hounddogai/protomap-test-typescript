import { RetentionPlan } from "./retention-plan.js";

/** A rule a retention plan must pass. Check returns its problems, or none. */
export interface RetentionPlanRule {
  check(item: RetentionPlan): string[];
}

export class RetentionPlanConversionRateRangeRule implements RetentionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionPlan): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RetentionPlanTimezoneLengthRule implements RetentionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionPlan): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionPlanStartsAtRangeRule implements RetentionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionPlan): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionPlanRequiredTimezoneRule implements RetentionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionPlan): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionPlanTitleLengthRule implements RetentionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionPlan): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionPlanCodePrefixRule implements RetentionPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a retention plan. */
export class RetentionPlanValidator {
  rules: RetentionPlanRule[];

  constructor(rules: RetentionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionPlan[]): Map<string, string[]> {
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

export function defaultRetentionPlanValidator(): RetentionPlanValidator {
  return new RetentionPlanValidator(
    [
      new RetentionPlanConversionRateRangeRule(8.4, 3082.2),
      new RetentionPlanTimezoneLengthRule(80),
      new RetentionPlanStartsAtRangeRule(16, 3600),
      new RetentionPlanRequiredTimezoneRule("retention plan needs a value"),
      new RetentionPlanTitleLengthRule(32),
      new RetentionPlanCodePrefixRule("ACM"),
    ],
  );
}
