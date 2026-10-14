import * as text from "../../../../kit/text.js";
import { ManualBranchTemplate } from "./manual-branch-template.js";

/** A rule a manual branch template must pass. Check returns its problems, or none. */
export interface ManualBranchTemplateRule {
  check(item: ManualBranchTemplate): string[];
}

export class ManualBranchTemplateAllowedCodeRule implements ManualBranchTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualBranchTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class ManualBranchTemplateLabelLengthRule implements ManualBranchTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBranchTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualBranchTemplateMaximumRangeRule implements ManualBranchTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBranchTemplate): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualBranchTemplateRequiredLabelRule implements ManualBranchTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBranchTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual branch template. */
export class ManualBranchTemplateValidator {
  rules: ManualBranchTemplateRule[];

  constructor(rules: ManualBranchTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBranchTemplate): string[] {
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

  requireValid(item: ManualBranchTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBranchTemplate[]): Map<string, string[]> {
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

export function defaultManualBranchTemplateValidator(): ManualBranchTemplateValidator {
  return new ManualBranchTemplateValidator(
    [
      new ManualBranchTemplateAllowedCodeRule(["tiered"]),
      new ManualBranchTemplateLabelLengthRule(1000),
      new ManualBranchTemplateMaximumRangeRule(4.3, 1206.6),
      new ManualBranchTemplateRequiredLabelRule("manual branch template needs a value"),
    ],
  );
}
