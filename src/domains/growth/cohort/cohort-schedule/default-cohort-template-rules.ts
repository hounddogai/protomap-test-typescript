import { DefaultCohortTemplate } from "./default-cohort-template.js";

/** A rule a default cohort template must pass. Check returns its problems, or none. */
export interface DefaultCohortTemplateRule {
  check(item: DefaultCohortTemplate): string[];
}

export class DefaultCohortTemplateRequiredExternalRefRule implements DefaultCohortTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCohortTemplate): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultCohortTemplateNameLengthRule implements DefaultCohortTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultCohortTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultCohortTemplateRatioRangeRule implements DefaultCohortTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultCohortTemplate): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultCohortTemplateRequiredCodeRule implements DefaultCohortTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCohortTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default cohort template. */
export class DefaultCohortTemplateValidator {
  rules: DefaultCohortTemplateRule[];

  constructor(rules: DefaultCohortTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultCohortTemplate): string[] {
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

  requireValid(item: DefaultCohortTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultCohortTemplate[]): Map<string, string[]> {
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

export function defaultDefaultCohortTemplateValidator(): DefaultCohortTemplateValidator {
  return new DefaultCohortTemplateValidator(
    [
      new DefaultCohortTemplateRequiredExternalRefRule("default cohort template needs a value"),
      new DefaultCohortTemplateNameLengthRule(86400),
      new DefaultCohortTemplateRatioRangeRule(7.1, 1497),
      new DefaultCohortTemplateRequiredCodeRule("default cohort template needs a value"),
    ],
  );
}
