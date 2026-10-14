import { RollingCsatCycle } from "./rolling-csat-cycle.js";

/** A rule a rolling csat cycle must pass. Check returns its problems, or none. */
export interface RollingCsatCycleRule {
  check(item: RollingCsatCycle): string[];
}

export class RollingCsatCycleRequiredReviewerRule implements RollingCsatCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingCsatCycle): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class RollingCsatCycleCodeLengthRule implements RollingCsatCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCsatCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingCsatCycleCodePrefixRule implements RollingCsatCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingCsatCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingCsatCycleTitleLengthRule implements RollingCsatCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingCsatCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling csat cycle. */
export class RollingCsatCycleValidator {
  rules: RollingCsatCycleRule[];

  constructor(rules: RollingCsatCycleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingCsatCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingCsatCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingCsatCycle[]): Map<string, string[]> {
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

export function defaultRollingCsatCycleValidator(): RollingCsatCycleValidator {
  return new RollingCsatCycleValidator(
    [
      new RollingCsatCycleRequiredReviewerRule("rolling csat cycle needs an entry"),
      new RollingCsatCycleCodeLengthRule(255),
      new RollingCsatCycleCodePrefixRule("X"),
      new RollingCsatCycleTitleLengthRule(1000),
    ],
  );
}
