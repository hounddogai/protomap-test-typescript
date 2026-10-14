import { CohortTemplate } from "./cohort-template.js";

/** A rule a cohort template must pass. Check returns its problems, or none. */
export interface CohortTemplateRule {
  check(item: CohortTemplate): string[];
}

export class CohortTemplateMarginRangeRule implements CohortTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortTemplate): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortTemplateRequiredLabelRule implements CohortTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortTemplate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CohortTemplateOwnerIdLengthRule implements CohortTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortTemplate): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortTemplateRequiredCodeRule implements CohortTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CohortTemplateRequiredOwnerIdRule implements CohortTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortTemplate): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class CohortTemplateCodePrefixRule implements CohortTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a cohort template. */
export class CohortTemplateValidator {
  rules: CohortTemplateRule[];

  constructor(rules: CohortTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: CohortTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CohortTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortTemplate[]): Map<string, string[]> {
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

export function defaultCohortTemplateValidator(): CohortTemplateValidator {
  return new CohortTemplateValidator(
    [
      new CohortTemplateMarginRangeRule(1.2, 4390.5),
      new CohortTemplateRequiredLabelRule("cohort template needs this field"),
      new CohortTemplateOwnerIdLengthRule(86400),
      new CohortTemplateRequiredCodeRule("cohort template needs an entry"),
      new CohortTemplateRequiredOwnerIdRule("cohort template needs a value"),
      new CohortTemplateCodePrefixRule("ACM"),
    ],
  );
}
