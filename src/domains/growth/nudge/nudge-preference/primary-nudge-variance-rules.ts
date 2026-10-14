import { PrimaryNudgeVariance } from "./primary-nudge-variance.js";

/** A rule a primary nudge variance must pass. Check returns its problems, or none. */
export interface PrimaryNudgeVarianceRule {
  check(item: PrimaryNudgeVariance): string[];
}

export class PrimaryNudgeVarianceCodePrefixRule implements PrimaryNudgeVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryNudgeVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryNudgeVarianceTitleLengthRule implements PrimaryNudgeVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryNudgeVariance): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryNudgeVarianceContactEmailLengthRule implements PrimaryNudgeVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryNudgeVariance): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryNudgeVarianceRequiredCodeRule implements PrimaryNudgeVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryNudgeVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryNudgeVarianceRevisionRangeRule implements PrimaryNudgeVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryNudgeVariance): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary nudge variance. */
export class PrimaryNudgeVarianceValidator {
  rules: PrimaryNudgeVarianceRule[];

  constructor(rules: PrimaryNudgeVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryNudgeVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryNudgeVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryNudgeVariance[]): Map<string, string[]> {
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

export function defaultPrimaryNudgeVarianceValidator(): PrimaryNudgeVarianceValidator {
  return new PrimaryNudgeVarianceValidator(
    [
      new PrimaryNudgeVarianceCodePrefixRule("Q"),
      new PrimaryNudgeVarianceTitleLengthRule(3600),
      new PrimaryNudgeVarianceContactEmailLengthRule(16),
      new PrimaryNudgeVarianceRequiredCodeRule("primary nudge variance needs an entry"),
      new PrimaryNudgeVarianceRevisionRangeRule(255, 86400),
    ],
  );
}
