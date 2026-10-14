import * as text from "../../../../kit/text.js";
import { PrimaryActivationTemplate } from "./primary-activation-template.js";

/** A rule a primary activation template must pass. Check returns its problems, or none. */
export interface PrimaryActivationTemplateRule {
  check(item: PrimaryActivationTemplate): string[];
}

export class PrimaryActivationTemplateRequiredLabelRule implements PrimaryActivationTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryActivationTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryActivationTemplateAllowedCodeRule implements PrimaryActivationTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryActivationTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class PrimaryActivationTemplateCurrencyLengthRule implements PrimaryActivationTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryActivationTemplate): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary activation template. */
export class PrimaryActivationTemplateValidator {
  rules: PrimaryActivationTemplateRule[];

  constructor(rules: PrimaryActivationTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryActivationTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryActivationTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryActivationTemplate[]): Map<string, string[]> {
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

export function defaultPrimaryActivationTemplateValidator(): PrimaryActivationTemplateValidator {
  return new PrimaryActivationTemplateValidator(
    [
      new PrimaryActivationTemplateRequiredLabelRule("primary activation template needs this field"),
      new PrimaryActivationTemplateAllowedCodeRule([]),
      new PrimaryActivationTemplateCurrencyLengthRule(32),
    ],
  );
}
