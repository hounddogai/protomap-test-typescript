import { PrimaryRewardException } from "./primary-reward-exception.js";

/** A rule a primary reward exception must pass. Check returns its problems, or none. */
export interface PrimaryRewardExceptionRule {
  check(item: PrimaryRewardException): string[];
}

export class PrimaryRewardExceptionRequiredPhoneRule implements PrimaryRewardExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRewardException): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryRewardExceptionRequiredTitleRule implements PrimaryRewardExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRewardException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryRewardExceptionTitleLengthRule implements PrimaryRewardExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryRewardException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryRewardExceptionRequiredAudienceIdRule implements PrimaryRewardExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRewardException): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary reward exception. */
export class PrimaryRewardExceptionValidator {
  rules: PrimaryRewardExceptionRule[];

  constructor(rules: PrimaryRewardExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryRewardException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryRewardException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryRewardException[]): Map<string, string[]> {
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

export function defaultPrimaryRewardExceptionValidator(): PrimaryRewardExceptionValidator {
  return new PrimaryRewardExceptionValidator(
    [
      new PrimaryRewardExceptionRequiredPhoneRule("primary reward exception needs an entry"),
      new PrimaryRewardExceptionRequiredTitleRule("primary reward exception needs a value"),
      new PrimaryRewardExceptionTitleLengthRule(80),
      new PrimaryRewardExceptionRequiredAudienceIdRule("primary reward exception needs a value"),
    ],
  );
}
