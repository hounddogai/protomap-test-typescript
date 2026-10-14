import { DoubleOptInTemplate } from "./double-opt-in-template.js";

/** A rule a double opt in template must pass. Check returns its problems, or none. */
export interface DoubleOptInTemplateRule {
  check(item: DoubleOptInTemplate): string[];
}

export class DoubleOptInTemplateRequiredCodeRule implements DoubleOptInTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInTemplateBatchSizeRangeRule implements DoubleOptInTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInTemplate): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInTemplateTitleLengthRule implements DoubleOptInTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a double opt in template. */
export class DoubleOptInTemplateValidator {
  rules: DoubleOptInTemplateRule[];

  constructor(rules: DoubleOptInTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInTemplate): string[] {
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

  requireValid(item: DoubleOptInTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInTemplate[]): Map<string, string[]> {
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

export function defaultDoubleOptInTemplateValidator(): DoubleOptInTemplateValidator {
  return new DoubleOptInTemplateValidator(
    [
      new DoubleOptInTemplateRequiredCodeRule("double opt in template needs a value"),
      new DoubleOptInTemplateBatchSizeRangeRule(16, 1000),
      new DoubleOptInTemplateTitleLengthRule(1000),
    ],
  );
}
