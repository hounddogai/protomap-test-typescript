import { StrictStreakTemplate } from "./strict-streak-template.js";

/** A rule a strict streak template must pass. Check returns its problems, or none. */
export interface StrictStreakTemplateRule {
  check(item: StrictStreakTemplate): string[];
}

export class StrictStreakTemplateCodeLengthRule implements StrictStreakTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictStreakTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictStreakTemplateMinimumRangeRule implements StrictStreakTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictStreakTemplate): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictStreakTemplateTitleLengthRule implements StrictStreakTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictStreakTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict streak template. */
export class StrictStreakTemplateValidator {
  rules: StrictStreakTemplateRule[];

  constructor(rules: StrictStreakTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: StrictStreakTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictStreakTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictStreakTemplate[]): Map<string, string[]> {
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

export function defaultStrictStreakTemplateValidator(): StrictStreakTemplateValidator {
  return new StrictStreakTemplateValidator(
    [
      new StrictStreakTemplateCodeLengthRule(16),
      new StrictStreakTemplateMinimumRangeRule(2.1, 895.9),
      new StrictStreakTemplateTitleLengthRule(32),
    ],
  );
}
