import * as text from "../../../../kit/text.js";
import { SlaTemplate } from "./sla-template.js";

/** A rule a sla template must pass. Check returns its problems, or none. */
export interface SlaTemplateRule {
  check(item: SlaTemplate): string[];
}

export class SlaTemplateAllowedCodeRule implements SlaTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class SlaTemplateRequiredLabelRule implements SlaTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SlaTemplateRequiredCategoryRule implements SlaTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaTemplate): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class SlaTemplateCategoryLengthRule implements SlaTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaTemplate): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla template. */
export class SlaTemplateValidator {
  rules: SlaTemplateRule[];

  constructor(rules: SlaTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: SlaTemplate): string[] {
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

  requireValid(item: SlaTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaTemplate[]): Map<string, string[]> {
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

export function defaultSlaTemplateValidator(): SlaTemplateValidator {
  return new SlaTemplateValidator(
    [
      new SlaTemplateAllowedCodeRule([]),
      new SlaTemplateRequiredLabelRule("sla template needs a value"),
      new SlaTemplateRequiredCategoryRule("sla template needs an entry"),
      new SlaTemplateCategoryLengthRule(16),
    ],
  );
}
