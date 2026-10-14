import { ExitRuleMilestone } from "./exit-rule-milestone.js";

/** A rule a exit rule milestone must pass. Check returns its problems, or none. */
export interface ExitRuleMilestoneRule {
  check(item: ExitRuleMilestone): string[];
}

export class ExitRuleMilestoneTagsLimitRule implements ExitRuleMilestoneRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ExitRuleMilestone): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ExitRuleMilestoneRequiredCodeRule implements ExitRuleMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleMilestoneCodePrefixRule implements ExitRuleMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ExitRuleMilestoneLabelLengthRule implements ExitRuleMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a exit rule milestone. */
export class ExitRuleMilestoneValidator {
  rules: ExitRuleMilestoneRule[];

  constructor(rules: ExitRuleMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleMilestone[]): Map<string, string[]> {
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

export function defaultExitRuleMilestoneValidator(): ExitRuleMilestoneValidator {
  return new ExitRuleMilestoneValidator(
    [
      new ExitRuleMilestoneTagsLimitRule(120, ["strict", "primary", "fallback"]),
      new ExitRuleMilestoneRequiredCodeRule("exit rule milestone needs this field"),
      new ExitRuleMilestoneCodePrefixRule("X"),
      new ExitRuleMilestoneLabelLengthRule(64),
    ],
  );
}
