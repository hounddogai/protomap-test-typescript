import { DefaultPostMilestone } from "./default-post-milestone.js";

/** A rule a default post milestone must pass. Check returns its problems, or none. */
export interface DefaultPostMilestoneRule {
  check(item: DefaultPostMilestone): string[];
}

export class DefaultPostMilestoneNameLengthRule implements DefaultPostMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPostMilestone): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPostMilestoneRequiredAudienceIdRule implements DefaultPostMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPostMilestone): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPostMilestoneRequiredNameRule implements DefaultPostMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPostMilestone): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPostMilestoneCodeLengthRule implements DefaultPostMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPostMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default post milestone. */
export class DefaultPostMilestoneValidator {
  rules: DefaultPostMilestoneRule[];

  constructor(rules: DefaultPostMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPostMilestone): string[] {
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

  requireValid(item: DefaultPostMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPostMilestone[]): Map<string, string[]> {
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

export function defaultDefaultPostMilestoneValidator(): DefaultPostMilestoneValidator {
  return new DefaultPostMilestoneValidator(
    [
      new DefaultPostMilestoneNameLengthRule(86400),
      new DefaultPostMilestoneRequiredAudienceIdRule("default post milestone needs this field"),
      new DefaultPostMilestoneRequiredNameRule("default post milestone needs a value"),
      new DefaultPostMilestoneCodeLengthRule(120),
    ],
  );
}
