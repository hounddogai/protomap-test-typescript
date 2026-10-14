import { SeasonalActivationException } from "./seasonal-activation-exception.js";

/** A rule a seasonal activation exception must pass. Check returns its problems, or none. */
export interface SeasonalActivationExceptionRule {
  check(item: SeasonalActivationException): string[];
}

export class SeasonalActivationExceptionCodePrefixRule implements SeasonalActivationExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalActivationException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalActivationExceptionCohortLengthRule implements SeasonalActivationExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalActivationException): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalActivationExceptionCodeLengthRule implements SeasonalActivationExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalActivationException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal activation exception. */
export class SeasonalActivationExceptionValidator {
  rules: SeasonalActivationExceptionRule[];

  constructor(rules: SeasonalActivationExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalActivationException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalActivationException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalActivationException[]): Map<string, string[]> {
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

export function defaultSeasonalActivationExceptionValidator(): SeasonalActivationExceptionValidator {
  return new SeasonalActivationExceptionValidator(
    [
      new SeasonalActivationExceptionCodePrefixRule("ACM"),
      new SeasonalActivationExceptionCohortLengthRule(86400),
      new SeasonalActivationExceptionCodeLengthRule(120),
    ],
  );
}
