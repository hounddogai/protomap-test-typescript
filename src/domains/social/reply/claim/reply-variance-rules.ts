import { ReplyVariance } from "./reply-variance.js";

/** A rule a reply variance must pass. Check returns its problems, or none. */
export interface ReplyVarianceRule {
  check(item: ReplyVariance): string[];
}

export class ReplyVarianceCodePrefixRule implements ReplyVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyVarianceRequiredNameRule implements ReplyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyVariance): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyVariancePriorityRangeRule implements ReplyVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyVariance): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyVarianceRequiredCodeRule implements ReplyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyVarianceRequiredCohortRule implements ReplyVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyVariance): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reply variance. */
export class ReplyVarianceValidator {
  rules: ReplyVarianceRule[];

  constructor(rules: ReplyVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyVariance): string[] {
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

  requireValid(item: ReplyVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyVariance[]): Map<string, string[]> {
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

export function defaultReplyVarianceValidator(): ReplyVarianceValidator {
  return new ReplyVarianceValidator(
    [
      new ReplyVarianceCodePrefixRule("ACM"),
      new ReplyVarianceRequiredNameRule("reply variance needs a value"),
      new ReplyVariancePriorityRangeRule(32, 80),
      new ReplyVarianceRequiredCodeRule("reply variance needs a value"),
      new ReplyVarianceRequiredCohortRule("reply variance needs an entry"),
    ],
  );
}
