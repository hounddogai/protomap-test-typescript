import * as text from "../../../../kit/text.js";
import { InsightTemplate } from "./insight-template.js";

/** A rule a insight template must pass. Check returns its problems, or none. */
export interface InsightTemplateRule {
  check(item: InsightTemplate): string[];
}

export class InsightTemplateAllowedSegmentRule implements InsightTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InsightTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is duplicated`];
    return [];
  }
}

export class InsightTemplateLabelLengthRule implements InsightTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightTemplate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightTemplateRequiredCodeRule implements InsightTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight template. */
export class InsightTemplateValidator {
  rules: InsightTemplateRule[];

  constructor(rules: InsightTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: InsightTemplate): string[] {
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

  requireValid(item: InsightTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightTemplate[]): Map<string, string[]> {
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

export function defaultInsightTemplateValidator(): InsightTemplateValidator {
  return new InsightTemplateValidator(
    [
      new InsightTemplateAllowedSegmentRule(["primary", "adaptive", "primary"]),
      new InsightTemplateLabelLengthRule(1000),
      new InsightTemplateRequiredCodeRule("insight template needs this field"),
    ],
  );
}
