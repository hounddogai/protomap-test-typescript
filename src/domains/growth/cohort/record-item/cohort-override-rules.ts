import * as text from "../../../../kit/text.js";
import { CohortOverride } from "./cohort-override.js";

/** A rule a cohort override must pass. Check returns its problems, or none. */
export interface CohortOverrideRule {
  check(item: CohortOverride): string[];
}

export class CohortOverrideAllowedCategoryRule implements CohortOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is missing`];
    return [];
  }
}

export class CohortOverrideRequiredNameRule implements CohortOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortOverride): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CohortOverrideCodeLengthRule implements CohortOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortOverrideNameLengthRule implements CohortOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortOverrideRequiredCodeRule implements CohortOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort override. */
export class CohortOverrideValidator {
  rules: CohortOverrideRule[];

  constructor(rules: CohortOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: CohortOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortOverride[]): Map<string, string[]> {
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

export function defaultCohortOverrideValidator(): CohortOverrideValidator {
  return new CohortOverrideValidator(
    [
      new CohortOverrideAllowedCategoryRule(["default", "seasonal"]),
      new CohortOverrideRequiredNameRule("cohort override needs an entry"),
      new CohortOverrideCodeLengthRule(3600),
      new CohortOverrideNameLengthRule(32),
      new CohortOverrideRequiredCodeRule("cohort override needs an entry"),
    ],
  );
}
