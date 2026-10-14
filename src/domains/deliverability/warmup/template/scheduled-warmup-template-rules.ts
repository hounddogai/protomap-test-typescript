import { ScheduledWarmupTemplate } from "./scheduled-warmup-template.js";

/** A rule a scheduled warmup template must pass. Check returns its problems, or none. */
export interface ScheduledWarmupTemplateRule {
  check(item: ScheduledWarmupTemplate): string[];
}

export class ScheduledWarmupTemplateLocaleLengthRule implements ScheduledWarmupTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWarmupTemplate): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWarmupTemplateCodeLengthRule implements ScheduledWarmupTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledWarmupTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledWarmupTemplateMarginRangeRule implements ScheduledWarmupTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledWarmupTemplate): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledWarmupTemplateRequiredCodeRule implements ScheduledWarmupTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledWarmupTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled warmup template. */
export class ScheduledWarmupTemplateValidator {
  rules: ScheduledWarmupTemplateRule[];

  constructor(rules: ScheduledWarmupTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledWarmupTemplate): string[] {
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

  requireValid(item: ScheduledWarmupTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledWarmupTemplate[]): Map<string, string[]> {
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

export function defaultScheduledWarmupTemplateValidator(): ScheduledWarmupTemplateValidator {
  return new ScheduledWarmupTemplateValidator(
    [
      new ScheduledWarmupTemplateLocaleLengthRule(64),
      new ScheduledWarmupTemplateCodeLengthRule(120),
      new ScheduledWarmupTemplateMarginRangeRule(0.2, 3292),
      new ScheduledWarmupTemplateRequiredCodeRule("scheduled warmup template needs an entry"),
    ],
  );
}
