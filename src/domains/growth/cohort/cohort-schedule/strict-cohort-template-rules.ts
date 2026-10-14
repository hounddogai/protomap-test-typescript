import * as text from "../../../../kit/text.js";
import { StrictCohortTemplate } from "./strict-cohort-template.js";

/** A rule a strict cohort template must pass. Check returns its problems, or none. */
export interface StrictCohortTemplateRule {
  check(item: StrictCohortTemplate): string[];
}

export class StrictCohortTemplateCodePrefixRule implements StrictCohortTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictCohortTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictCohortTemplateBudgetRangeRule implements StrictCohortTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCohortTemplate): string[] {
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

export class StrictCohortTemplateAllowedNameRule implements StrictCohortTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictCohortTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class StrictCohortTemplateVisibleGuardRule implements StrictCohortTemplateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictCohortTemplate): string[] {
    if (item.visible && item.floorValue > this.limit) return [`floor value ${item.floorValue} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class StrictCohortTemplateFloorValueRangeRule implements StrictCohortTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCohortTemplate): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict cohort template. */
export class StrictCohortTemplateValidator {
  rules: StrictCohortTemplateRule[];

  constructor(rules: StrictCohortTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCohortTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictCohortTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCohortTemplate[]): Map<string, string[]> {
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

export function defaultStrictCohortTemplateValidator(): StrictCohortTemplateValidator {
  return new StrictCohortTemplateValidator(
    [
      new StrictCohortTemplateCodePrefixRule("REF"),
      new StrictCohortTemplateBudgetRangeRule(4.3, 2367.1),
      new StrictCohortTemplateAllowedNameRule(["lenient", "legacy", "manual"]),
      new StrictCohortTemplateVisibleGuardRule(2.4),
      new StrictCohortTemplateFloorValueRangeRule(8.4, 1385.2),
    ],
  );
}
