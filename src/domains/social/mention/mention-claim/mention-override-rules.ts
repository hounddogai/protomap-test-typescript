import * as text from "../../../../kit/text.js";
import { MentionOverride } from "./mention-override.js";

/** A rule a mention override must pass. Check returns its problems, or none. */
export interface MentionOverrideRule {
  check(item: MentionOverride): string[];
}

export class MentionOverrideRequiredCodeRule implements MentionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MentionOverrideAllowedCohortRule implements MentionOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is not allowed`];
    return [];
  }
}

export class MentionOverrideCohortLengthRule implements MentionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionOverride): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention override. */
export class MentionOverrideValidator {
  rules: MentionOverrideRule[];

  constructor(rules: MentionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: MentionOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionOverride[]): Map<string, string[]> {
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

export function defaultMentionOverrideValidator(): MentionOverrideValidator {
  return new MentionOverrideValidator(
    [
      new MentionOverrideRequiredCodeRule("mention override needs an entry"),
      new MentionOverrideAllowedCohortRule(["tiered", "capped", "regional"]),
      new MentionOverrideCohortLengthRule(16),
    ],
  );
}
