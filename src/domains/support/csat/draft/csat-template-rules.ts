import * as text from "../../../../kit/text.js";
import { CsatTemplate } from "./csat-template.js";

/** A rule a csat template must pass. Check returns its problems, or none. */
export interface CsatTemplateRule {
  check(item: CsatTemplate): string[];
}

export class CsatTemplateAllowedCurrencyRule implements CsatTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is below minimum`];
    return [];
  }
}

export class CsatTemplateRequiredLabelRule implements CsatTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CsatTemplateCurrencyLengthRule implements CsatTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatTemplate): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat template. */
export class CsatTemplateValidator {
  rules: CsatTemplateRule[];

  constructor(rules: CsatTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: CsatTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatTemplate[]): Map<string, string[]> {
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

export function defaultCsatTemplateValidator(): CsatTemplateValidator {
  return new CsatTemplateValidator(
    [
      new CsatTemplateAllowedCurrencyRule(["default"]),
      new CsatTemplateRequiredLabelRule("csat template needs a value"),
      new CsatTemplateCurrencyLengthRule(255),
    ],
  );
}
