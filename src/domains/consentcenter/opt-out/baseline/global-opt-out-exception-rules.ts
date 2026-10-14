import * as text from "../../../../kit/text.js";
import { GlobalOptOutException } from "./global-opt-out-exception.js";

/** A rule a global opt out exception must pass. Check returns its problems, or none. */
export interface GlobalOptOutExceptionRule {
  check(item: GlobalOptOutException): string[];
}

export class GlobalOptOutExceptionRequiredAudienceIdRule implements GlobalOptOutExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalOptOutException): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalOptOutExceptionAudienceIdLengthRule implements GlobalOptOutExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalOptOutException): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalOptOutExceptionAllowedReviewerRule implements GlobalOptOutExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalOptOutException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is unknown`];
    return [];
  }
}

export class GlobalOptOutExceptionTitleLengthRule implements GlobalOptOutExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalOptOutException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global opt out exception. */
export class GlobalOptOutExceptionValidator {
  rules: GlobalOptOutExceptionRule[];

  constructor(rules: GlobalOptOutExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalOptOutException): string[] {
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

  requireValid(item: GlobalOptOutException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalOptOutException[]): Map<string, string[]> {
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

export function defaultGlobalOptOutExceptionValidator(): GlobalOptOutExceptionValidator {
  return new GlobalOptOutExceptionValidator(
    [
      new GlobalOptOutExceptionRequiredAudienceIdRule("global opt out exception needs a value"),
      new GlobalOptOutExceptionAudienceIdLengthRule(64),
      new GlobalOptOutExceptionAllowedReviewerRule([]),
      new GlobalOptOutExceptionTitleLengthRule(3600),
    ],
  );
}
