import * as text from "../../../../kit/text.js";
import { EnrollmentTemplate } from "./enrollment-template.js";

/** A rule a enrollment template must pass. Check returns its problems, or none. */
export interface EnrollmentTemplateRule {
  check(item: EnrollmentTemplate): string[];
}

export class EnrollmentTemplateAllowedCurrencyRule implements EnrollmentTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is inconsistent`];
    return [];
  }
}

export class EnrollmentTemplateRequiredNameRule implements EnrollmentTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentTemplateCodeLengthRule implements EnrollmentTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentTemplateCurrencyLengthRule implements EnrollmentTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentTemplate): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentTemplateNameLengthRule implements EnrollmentTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment template. */
export class EnrollmentTemplateValidator {
  rules: EnrollmentTemplateRule[];

  constructor(rules: EnrollmentTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentTemplate[]): Map<string, string[]> {
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

export function defaultEnrollmentTemplateValidator(): EnrollmentTemplateValidator {
  return new EnrollmentTemplateValidator(
    [
      new EnrollmentTemplateAllowedCurrencyRule([]),
      new EnrollmentTemplateRequiredNameRule("enrollment template needs this field"),
      new EnrollmentTemplateCodeLengthRule(64),
      new EnrollmentTemplateCurrencyLengthRule(64),
      new EnrollmentTemplateNameLengthRule(120),
    ],
  );
}
