import { RegionalPlacementTemplate } from "./regional-placement-template.js";

/** A rule a regional placement template must pass. Check returns its problems, or none. */
export interface RegionalPlacementTemplateRule {
  check(item: RegionalPlacementTemplate): string[];
}

export class RegionalPlacementTemplateTitleLengthRule implements RegionalPlacementTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPlacementTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPlacementTemplateRequiredReviewerRule implements RegionalPlacementTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPlacementTemplate): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPlacementTemplateBudgetRangeRule implements RegionalPlacementTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPlacementTemplate): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional placement template. */
export class RegionalPlacementTemplateValidator {
  rules: RegionalPlacementTemplateRule[];

  constructor(rules: RegionalPlacementTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPlacementTemplate): string[] {
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

  requireValid(item: RegionalPlacementTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPlacementTemplate[]): Map<string, string[]> {
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

export function defaultRegionalPlacementTemplateValidator(): RegionalPlacementTemplateValidator {
  return new RegionalPlacementTemplateValidator(
    [
      new RegionalPlacementTemplateTitleLengthRule(1000),
      new RegionalPlacementTemplateRequiredReviewerRule("regional placement template needs an entry"),
      new RegionalPlacementTemplateBudgetRangeRule(6, 2388.7),
    ],
  );
}
