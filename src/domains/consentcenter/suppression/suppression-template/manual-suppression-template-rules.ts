import { ManualSuppressionTemplate } from "./manual-suppression-template.js";

/** A rule a manual suppression template must pass. Check returns its problems, or none. */
export interface ManualSuppressionTemplateRule {
  check(item: ManualSuppressionTemplate): string[];
}

export class ManualSuppressionTemplateDescriptionLengthRule implements ManualSuppressionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualSuppressionTemplate): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualSuppressionTemplateAmountRangeRule implements ManualSuppressionTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualSuppressionTemplate): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualSuppressionTemplateLabelLengthRule implements ManualSuppressionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualSuppressionTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual suppression template. */
export class ManualSuppressionTemplateValidator {
  rules: ManualSuppressionTemplateRule[];

  constructor(rules: ManualSuppressionTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSuppressionTemplate): string[] {
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

  requireValid(item: ManualSuppressionTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSuppressionTemplate[]): Map<string, string[]> {
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

export function defaultManualSuppressionTemplateValidator(): ManualSuppressionTemplateValidator {
  return new ManualSuppressionTemplateValidator(
    [
      new ManualSuppressionTemplateDescriptionLengthRule(120),
      new ManualSuppressionTemplateAmountRangeRule(6.4, 404.6),
      new ManualSuppressionTemplateLabelLengthRule(16),
    ],
  );
}
