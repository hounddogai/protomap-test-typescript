import { RewardRuleAssignment } from "./reward-rule-assignment.js";

/** A rule a reward rule assignment must pass. Check returns its problems, or none. */
export interface RewardRuleAssignmentRule {
  check(item: RewardRuleAssignment): string[];
}

export class RewardRuleAssignmentRequiredTitleRule implements RewardRuleAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleAssignmentSendAtRangeRule implements RewardRuleAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleAssignment): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleAssignmentCodePrefixRule implements RewardRuleAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRuleAssignmentTitleLengthRule implements RewardRuleAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleAssignmentRequiredCodeRule implements RewardRuleAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward rule assignment. */
export class RewardRuleAssignmentValidator {
  rules: RewardRuleAssignmentRule[];

  constructor(rules: RewardRuleAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleAssignment[]): Map<string, string[]> {
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

export function defaultRewardRuleAssignmentValidator(): RewardRuleAssignmentValidator {
  return new RewardRuleAssignmentValidator(
    [
      new RewardRuleAssignmentRequiredTitleRule("reward rule assignment needs a value"),
      new RewardRuleAssignmentSendAtRangeRule(64, 64),
      new RewardRuleAssignmentCodePrefixRule("OPS"),
      new RewardRuleAssignmentTitleLengthRule(1000),
      new RewardRuleAssignmentRequiredCodeRule("reward rule assignment needs this field"),
    ],
  );
}
