import * as text from "../../../../kit/text.js";
import { SenderScore } from "./sender-score.js";

/** A rule a sender score must pass. Check returns its problems, or none. */
export interface SenderScoreRule {
  check(item: SenderScore): string[];
}

export class SenderScorePinnedGuardRule implements SenderScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SenderScore): string[] {
    if (item.pinned && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class SenderScoreSequenceRangeRule implements SenderScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderScore): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SenderScoreTitleLengthRule implements SenderScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderScoreAllowedVariantRule implements SenderScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is missing`];
    return [];
  }
}

export class SenderScoreRequiredVariantRule implements SenderScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderScore): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class SenderScoreCodeLengthRule implements SenderScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sender score. */
export class SenderScoreValidator {
  rules: SenderScoreRule[];

  constructor(rules: SenderScoreRule[]) {
    this.rules = rules;
  }

  validate(item: SenderScore): string[] {
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

  requireValid(item: SenderScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderScore[]): Map<string, string[]> {
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

export function defaultSenderScoreValidator(): SenderScoreValidator {
  return new SenderScoreValidator(
    [
      new SenderScorePinnedGuardRule(3600),
      new SenderScoreSequenceRangeRule(80, 120),
      new SenderScoreTitleLengthRule(86400),
      new SenderScoreAllowedVariantRule(["regional", "batched", "weighted"]),
      new SenderScoreRequiredVariantRule("sender score needs a value"),
      new SenderScoreCodeLengthRule(1000),
    ],
  );
}
