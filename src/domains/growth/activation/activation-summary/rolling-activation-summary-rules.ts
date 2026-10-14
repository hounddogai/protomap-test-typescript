import { RollingActivationSummary } from "./rolling-activation-summary.js";

/** A rule a rolling activation summary must pass. Check returns its problems, or none. */
export interface RollingActivationSummaryRule {
  check(item: RollingActivationSummary): string[];
}

export class RollingActivationSummaryNameLengthRule implements RollingActivationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingActivationSummary): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingActivationSummaryCodeLengthRule implements RollingActivationSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingActivationSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingActivationSummaryRequiredCodeRule implements RollingActivationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingActivationSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingActivationSummaryRequiredExternalRefRule implements RollingActivationSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingActivationSummary): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingActivationSummaryClicksRangeRule implements RollingActivationSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingActivationSummary): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling activation summary. */
export class RollingActivationSummaryValidator {
  rules: RollingActivationSummaryRule[];

  constructor(rules: RollingActivationSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RollingActivationSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingActivationSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingActivationSummary[]): Map<string, string[]> {
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

export function defaultRollingActivationSummaryValidator(): RollingActivationSummaryValidator {
  return new RollingActivationSummaryValidator(
    [
      new RollingActivationSummaryNameLengthRule(32),
      new RollingActivationSummaryCodeLengthRule(3600),
      new RollingActivationSummaryRequiredCodeRule("rolling activation summary needs an entry"),
      new RollingActivationSummaryRequiredExternalRefRule("rolling activation summary needs this field"),
      new RollingActivationSummaryClicksRangeRule(80, 80),
    ],
  );
}
