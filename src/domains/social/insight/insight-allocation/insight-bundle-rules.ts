import * as text from "../../../../kit/text.js";
import { InsightBundle } from "./insight-bundle.js";

/** A rule a insight bundle must pass. Check returns its problems, or none. */
export interface InsightBundleRule {
  check(item: InsightBundle): string[];
}

export class InsightBundleRequiredNameRule implements InsightBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class InsightBundleRequiredDescriptionRule implements InsightBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightBundle): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class InsightBundleAllowedDescriptionRule implements InsightBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InsightBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is above maximum`];
    return [];
  }
}

export class InsightBundleRequiredCodeRule implements InsightBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightBundleCodePrefixRule implements InsightBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InsightBundleRequiredCohortRule implements InsightBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightBundle): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight bundle. */
export class InsightBundleValidator {
  rules: InsightBundleRule[];

  constructor(rules: InsightBundleRule[]) {
    this.rules = rules;
  }

  validate(item: InsightBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightBundle[]): Map<string, string[]> {
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

export function defaultInsightBundleValidator(): InsightBundleValidator {
  return new InsightBundleValidator(
    [
      new InsightBundleRequiredNameRule("insight bundle needs an entry"),
      new InsightBundleRequiredDescriptionRule("insight bundle needs an entry"),
      new InsightBundleAllowedDescriptionRule(["lenient", "scheduled"]),
      new InsightBundleRequiredCodeRule("insight bundle needs a value"),
      new InsightBundleCodePrefixRule("REF"),
      new InsightBundleRequiredCohortRule("insight bundle needs an entry"),
    ],
  );
}
