import * as text from "../../../../kit/text.js";
import { ChallengeWindow } from "./challenge-window.js";

/** A rule a challenge window must pass. Check returns its problems, or none. */
export interface ChallengeWindowRule {
  check(item: ChallengeWindow): string[];
}

export class ChallengeWindowAllowedCodeRule implements ChallengeWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class ChallengeWindowCodeLengthRule implements ChallengeWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeWindowActiveGuardRule implements ChallengeWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ChallengeWindow): string[] {
    if (item.active && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ChallengeWindowRequiredCodeRule implements ChallengeWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeWindowTitleLengthRule implements ChallengeWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeWindow): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a challenge window. */
export class ChallengeWindowValidator {
  rules: ChallengeWindowRule[];

  constructor(rules: ChallengeWindowRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeWindow): string[] {
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

  requireValid(item: ChallengeWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeWindow[]): Map<string, string[]> {
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

export function defaultChallengeWindowValidator(): ChallengeWindowValidator {
  return new ChallengeWindowValidator(
    [
      new ChallengeWindowAllowedCodeRule([]),
      new ChallengeWindowCodeLengthRule(1000),
      new ChallengeWindowActiveGuardRule(255),
      new ChallengeWindowRequiredCodeRule("challenge window needs this field"),
      new ChallengeWindowTitleLengthRule(120),
    ],
  );
}
