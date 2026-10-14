import * as text from "../../../../kit/text.js";
import { ChallengeSchedule } from "./challenge-schedule.js";

/** A rule a challenge schedule must pass. Check returns its problems, or none. */
export interface ChallengeScheduleRule {
  check(item: ChallengeSchedule): string[];
}

export class ChallengeScheduleAllowedTitleRule implements ChallengeScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class ChallengeScheduleCodeLengthRule implements ChallengeScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeScheduleCodePrefixRule implements ChallengeScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeScheduleLabelLengthRule implements ChallengeScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeScheduleRequiredCodeRule implements ChallengeScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a challenge schedule. */
export class ChallengeScheduleValidator {
  rules: ChallengeScheduleRule[];

  constructor(rules: ChallengeScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeSchedule): string[] {
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

  requireValid(item: ChallengeSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeSchedule[]): Map<string, string[]> {
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

export function defaultChallengeScheduleValidator(): ChallengeScheduleValidator {
  return new ChallengeScheduleValidator(
    [
      new ChallengeScheduleAllowedTitleRule(["fallback", "regional", "lenient"]),
      new ChallengeScheduleCodeLengthRule(64),
      new ChallengeScheduleCodePrefixRule("X"),
      new ChallengeScheduleLabelLengthRule(255),
      new ChallengeScheduleRequiredCodeRule("challenge schedule needs an entry"),
    ],
  );
}
