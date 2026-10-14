import { LenientWarmupTemplate } from "./lenient-warmup-template.js";

/** A rule a lenient warmup template must pass. Check returns its problems, or none. */
export interface LenientWarmupTemplateRule {
  check(item: LenientWarmupTemplate): string[];
}

export class LenientWarmupTemplateTitleLengthRule implements LenientWarmupTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWarmupTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWarmupTemplateCodeLengthRule implements LenientWarmupTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWarmupTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWarmupTemplateLabelLengthRule implements LenientWarmupTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientWarmupTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientWarmupTemplateWindowDaysRangeRule implements LenientWarmupTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWarmupTemplate): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientWarmupTemplateRequiredLabelRule implements LenientWarmupTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientWarmupTemplateArchivedGuardRule implements LenientWarmupTemplateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientWarmupTemplate): string[] {
    if (item.archived && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a lenient warmup template. */
export class LenientWarmupTemplateValidator {
  rules: LenientWarmupTemplateRule[];

  constructor(rules: LenientWarmupTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWarmupTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientWarmupTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWarmupTemplate[]): Map<string, string[]> {
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

export function defaultLenientWarmupTemplateValidator(): LenientWarmupTemplateValidator {
  return new LenientWarmupTemplateValidator(
    [
      new LenientWarmupTemplateTitleLengthRule(80),
      new LenientWarmupTemplateCodeLengthRule(64),
      new LenientWarmupTemplateLabelLengthRule(86400),
      new LenientWarmupTemplateWindowDaysRangeRule(16, 64),
      new LenientWarmupTemplateRequiredLabelRule("lenient warmup template needs an entry"),
      new LenientWarmupTemplateArchivedGuardRule(86400),
    ],
  );
}
