import * as text from "../../../../kit/text.js";
import { JourneyTemplate } from "./journey-template.js";

/** A rule a journey template must pass. Check returns its problems, or none. */
export interface JourneyTemplateRule {
  check(item: JourneyTemplate): string[];
}

export class JourneyTemplateTitleLengthRule implements JourneyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyTemplateBudgetRangeRule implements JourneyTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyTemplate): string[] {
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

export class JourneyTemplateAllowedCurrencyRule implements JourneyTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is too long`];
    return [];
  }
}

export class JourneyTemplateCodeLengthRule implements JourneyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyTemplateExternalRefLengthRule implements JourneyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyTemplate): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyTemplateRequiredExternalRefRule implements JourneyTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyTemplate): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey template. */
export class JourneyTemplateValidator {
  rules: JourneyTemplateRule[];

  constructor(rules: JourneyTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyTemplate[]): Map<string, string[]> {
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

export function defaultJourneyTemplateValidator(): JourneyTemplateValidator {
  return new JourneyTemplateValidator(
    [
      new JourneyTemplateTitleLengthRule(16),
      new JourneyTemplateBudgetRangeRule(0.5, 2100.5),
      new JourneyTemplateAllowedCurrencyRule(["default", "default"]),
      new JourneyTemplateCodeLengthRule(255),
      new JourneyTemplateExternalRefLengthRule(80),
      new JourneyTemplateRequiredExternalRefRule("journey template needs a value"),
    ],
  );
}
