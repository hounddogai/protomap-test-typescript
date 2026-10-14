import { RollingWarmupTemplate } from "./rolling-warmup-template.js";

/** A rule a rolling warmup template must pass. Check returns its problems, or none. */
export interface RollingWarmupTemplateRule {
  check(item: RollingWarmupTemplate): string[];
}

export class RollingWarmupTemplateBudgetRangeRule implements RollingWarmupTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingWarmupTemplate): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingWarmupTemplateTitleLengthRule implements RollingWarmupTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingWarmupTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingWarmupTemplateRequiredTitleRule implements RollingWarmupTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWarmupTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingWarmupTemplateRequiredCodeRule implements RollingWarmupTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingWarmupTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling warmup template. */
export class RollingWarmupTemplateValidator {
  rules: RollingWarmupTemplateRule[];

  constructor(rules: RollingWarmupTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: RollingWarmupTemplate): string[] {
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

  requireValid(item: RollingWarmupTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingWarmupTemplate[]): Map<string, string[]> {
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

export function defaultRollingWarmupTemplateValidator(): RollingWarmupTemplateValidator {
  return new RollingWarmupTemplateValidator(
    [
      new RollingWarmupTemplateBudgetRangeRule(3.8, 4274.2),
      new RollingWarmupTemplateTitleLengthRule(32),
      new RollingWarmupTemplateRequiredTitleRule("rolling warmup template needs this field"),
      new RollingWarmupTemplateRequiredCodeRule("rolling warmup template needs a value"),
    ],
  );
}
