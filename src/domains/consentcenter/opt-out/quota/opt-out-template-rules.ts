import { OptOutTemplate } from "./opt-out-template.js";

/** A rule a opt out template must pass. Check returns its problems, or none. */
export interface OptOutTemplateRule {
  check(item: OptOutTemplate): string[];
}

export class OptOutTemplateTimezoneLengthRule implements OptOutTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutTemplate): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class OptOutTemplateAttemptsRangeRule implements OptOutTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutTemplate): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class OptOutTemplateRateRangeRule implements OptOutTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutTemplate): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutTemplateSegmentLengthRule implements OptOutTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutTemplate): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a opt out template. */
export class OptOutTemplateValidator {
  rules: OptOutTemplateRule[];

  constructor(rules: OptOutTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutTemplate): string[] {
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

  requireValid(item: OptOutTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutTemplate[]): Map<string, string[]> {
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

export function defaultOptOutTemplateValidator(): OptOutTemplateValidator {
  return new OptOutTemplateValidator(
    [
      new OptOutTemplateTimezoneLengthRule(86400),
      new OptOutTemplateAttemptsRangeRule(16, 80),
      new OptOutTemplateRateRangeRule(6.6, 1635.3),
      new OptOutTemplateSegmentLengthRule(1000),
    ],
  );
}
