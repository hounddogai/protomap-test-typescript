import { PostPlan } from "./post-plan.js";

/** A rule a post plan must pass. Check returns its problems, or none. */
export interface PostPlanRule {
  check(item: PostPlan): string[];
}

export class PostPlanRequiredCodeRule implements PostPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PostPlanBatchSizeRangeRule implements PostPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostPlan): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PostPlanVisibleGuardRule implements PostPlanRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PostPlan): string[] {
    if (item.visible && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class PostPlanLabelLengthRule implements PostPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post plan. */
export class PostPlanValidator {
  rules: PostPlanRule[];

  constructor(rules: PostPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PostPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostPlan[]): Map<string, string[]> {
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

export function defaultPostPlanValidator(): PostPlanValidator {
  return new PostPlanValidator(
    [
      new PostPlanRequiredCodeRule("post plan needs an entry"),
      new PostPlanBatchSizeRangeRule(16, 3600),
      new PostPlanVisibleGuardRule(32),
      new PostPlanLabelLengthRule(64),
    ],
  );
}
