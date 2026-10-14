import { PostMilestone } from "./post-milestone.js";

/** A rule a post milestone must pass. Check returns its problems, or none. */
export interface PostMilestoneRule {
  check(item: PostMilestone): string[];
}

export class PostMilestoneCodePrefixRule implements PostMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostMilestoneRequiredOwnerIdRule implements PostMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostMilestone): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class PostMilestoneCurrencyLengthRule implements PostMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostMilestone): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post milestone. */
export class PostMilestoneValidator {
  rules: PostMilestoneRule[];

  constructor(rules: PostMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: PostMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostMilestone[]): Map<string, string[]> {
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

export function defaultPostMilestoneValidator(): PostMilestoneValidator {
  return new PostMilestoneValidator(
    [
      new PostMilestoneCodePrefixRule("REF"),
      new PostMilestoneRequiredOwnerIdRule("post milestone needs this field"),
      new PostMilestoneCurrencyLengthRule(1000),
    ],
  );
}
