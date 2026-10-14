import * as text from "../../../../kit/text.js";
import { ChallengeRequest } from "./challenge-request.js";

/** A rule a challenge request must pass. Check returns its problems, or none. */
export interface ChallengeRequestRule {
  check(item: ChallengeRequest): string[];
}

export class ChallengeRequestRequiredLabelRule implements ChallengeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeRequestAllowedCodeRule implements ChallengeRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class ChallengeRequestCodePrefixRule implements ChallengeRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeRequestLabelLengthRule implements ChallengeRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeRequest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a challenge request. */
export class ChallengeRequestValidator {
  rules: ChallengeRequestRule[];

  constructor(rules: ChallengeRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeRequest[]): Map<string, string[]> {
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

export function defaultChallengeRequestValidator(): ChallengeRequestValidator {
  return new ChallengeRequestValidator(
    [
      new ChallengeRequestRequiredLabelRule("challenge request needs this field"),
      new ChallengeRequestAllowedCodeRule(["fallback", "lenient", "strict"]),
      new ChallengeRequestCodePrefixRule("ACM"),
      new ChallengeRequestLabelLengthRule(64),
    ],
  );
}
