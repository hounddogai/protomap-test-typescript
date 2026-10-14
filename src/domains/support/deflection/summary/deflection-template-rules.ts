import { DeflectionTemplate } from "./deflection-template.js";

/** A rule a deflection template must pass. Check returns its problems, or none. */
export interface DeflectionTemplateRule {
  check(item: DeflectionTemplate): string[];
}

export class DeflectionTemplateNameLengthRule implements DeflectionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionTemplateRequiredLocaleRule implements DeflectionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionTemplate): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionTemplateCodeLengthRule implements DeflectionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection template. */
export class DeflectionTemplateValidator {
  rules: DeflectionTemplateRule[];

  constructor(rules: DeflectionTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionTemplate[]): Map<string, string[]> {
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

export function defaultDeflectionTemplateValidator(): DeflectionTemplateValidator {
  return new DeflectionTemplateValidator(
    [
      new DeflectionTemplateNameLengthRule(86400),
      new DeflectionTemplateRequiredLocaleRule("deflection template needs this field"),
      new DeflectionTemplateCodeLengthRule(86400),
    ],
  );
}
