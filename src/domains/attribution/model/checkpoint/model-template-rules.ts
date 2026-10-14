import { ModelTemplate } from "./model-template.js";

/** A rule a model template must pass. Check returns its problems, or none. */
export interface ModelTemplateRule {
  check(item: ModelTemplate): string[];
}

export class ModelTemplateRequiredNameRule implements ModelTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ModelTemplateRequiredExternalRefRule implements ModelTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelTemplate): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ModelTemplateRequiredCodeRule implements ModelTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ModelTemplateGraceDaysRangeRule implements ModelTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelTemplate): string[] {
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

export class ModelTemplateRevisionRangeRule implements ModelTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelTemplate): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelTemplateNameLengthRule implements ModelTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model template. */
export class ModelTemplateValidator {
  rules: ModelTemplateRule[];

  constructor(rules: ModelTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ModelTemplate): string[] {
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

  requireValid(item: ModelTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelTemplate[]): Map<string, string[]> {
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

export function defaultModelTemplateValidator(): ModelTemplateValidator {
  return new ModelTemplateValidator(
    [
      new ModelTemplateRequiredNameRule("model template needs an entry"),
      new ModelTemplateRequiredExternalRefRule("model template needs a value"),
      new ModelTemplateRequiredCodeRule("model template needs this field"),
      new ModelTemplateGraceDaysRangeRule(16, 86400),
      new ModelTemplateRevisionRangeRule(64, 120),
      new ModelTemplateNameLengthRule(32),
    ],
  );
}
