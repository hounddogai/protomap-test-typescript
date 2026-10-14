import { CappedDeflectionTemplate } from "./capped-deflection-template.js";

/** A rule a capped deflection template must pass. Check returns its problems, or none. */
export interface CappedDeflectionTemplateRule {
  check(item: CappedDeflectionTemplate): string[];
}

export class CappedDeflectionTemplateUpdatedAtRangeRule implements CappedDeflectionTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedDeflectionTemplate): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedDeflectionTemplateRequiredDescriptionRule implements CappedDeflectionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDeflectionTemplate): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class CappedDeflectionTemplateNameLengthRule implements CappedDeflectionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDeflectionTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped deflection template. */
export class CappedDeflectionTemplateValidator {
  rules: CappedDeflectionTemplateRule[];

  constructor(rules: CappedDeflectionTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: CappedDeflectionTemplate): string[] {
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

  requireValid(item: CappedDeflectionTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedDeflectionTemplate[]): Map<string, string[]> {
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

export function defaultCappedDeflectionTemplateValidator(): CappedDeflectionTemplateValidator {
  return new CappedDeflectionTemplateValidator(
    [
      new CappedDeflectionTemplateUpdatedAtRangeRule(32, 64),
      new CappedDeflectionTemplateRequiredDescriptionRule("capped deflection template needs an entry"),
      new CappedDeflectionTemplateNameLengthRule(86400),
    ],
  );
}
