import { GlobalCsatTemplate } from "./global-csat-template.js";

/** A rule a global csat template must pass. Check returns its problems, or none. */
export interface GlobalCsatTemplateRule {
  check(item: GlobalCsatTemplate): string[];
}

export class GlobalCsatTemplateCategoryLengthRule implements GlobalCsatTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCsatTemplate): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalCsatTemplateRequiredCategoryRule implements GlobalCsatTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCsatTemplate): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCsatTemplateRequiredLabelRule implements GlobalCsatTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCsatTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalCsatTemplateRevisionRangeRule implements GlobalCsatTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalCsatTemplate): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalCsatTemplateCodeLengthRule implements GlobalCsatTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalCsatTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalCsatTemplateRequiredCodeRule implements GlobalCsatTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalCsatTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global csat template. */
export class GlobalCsatTemplateValidator {
  rules: GlobalCsatTemplateRule[];

  constructor(rules: GlobalCsatTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalCsatTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalCsatTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalCsatTemplate[]): Map<string, string[]> {
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

export function defaultGlobalCsatTemplateValidator(): GlobalCsatTemplateValidator {
  return new GlobalCsatTemplateValidator(
    [
      new GlobalCsatTemplateCategoryLengthRule(80),
      new GlobalCsatTemplateRequiredCategoryRule("global csat template needs an entry"),
      new GlobalCsatTemplateRequiredLabelRule("global csat template needs a value"),
      new GlobalCsatTemplateRevisionRangeRule(64, 3600),
      new GlobalCsatTemplateCodeLengthRule(120),
      new GlobalCsatTemplateRequiredCodeRule("global csat template needs an entry"),
    ],
  );
}
