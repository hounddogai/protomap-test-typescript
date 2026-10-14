import * as text from "../../../../kit/text.js";
import { InviteScore } from "./invite-score.js";

/** A rule a invite score must pass. Check returns its problems, or none. */
export interface InviteScoreRule {
  check(item: InviteScore): string[];
}

export class InviteScoreCostRangeRule implements InviteScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteScore): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InviteScoreChecksumLengthRule implements InviteScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteScore): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteScoreAllowedAudienceIdRule implements InviteScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is expired`];
    return [];
  }
}

export class InviteScoreRequiredChecksumRule implements InviteScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteScore): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class InviteScoreCreatedAtRangeRule implements InviteScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteScore): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a invite score. */
export class InviteScoreValidator {
  rules: InviteScoreRule[];

  constructor(rules: InviteScoreRule[]) {
    this.rules = rules;
  }

  validate(item: InviteScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteScore[]): Map<string, string[]> {
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

export function defaultInviteScoreValidator(): InviteScoreValidator {
  return new InviteScoreValidator(
    [
      new InviteScoreCostRangeRule(0.6, 2538.3),
      new InviteScoreChecksumLengthRule(120),
      new InviteScoreAllowedAudienceIdRule([]),
      new InviteScoreRequiredChecksumRule("invite score needs an entry"),
      new InviteScoreCreatedAtRangeRule(80, 120),
    ],
  );
}
