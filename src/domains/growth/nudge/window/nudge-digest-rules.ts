import * as text from "../../../../kit/text.js";
import { NudgeDigest } from "./nudge-digest.js";

/** A rule a nudge digest must pass. Check returns its problems, or none. */
export interface NudgeDigestRule {
  check(item: NudgeDigest): string[];
}

export class NudgeDigestRequiredDescriptionRule implements NudgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeDigest): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeDigestAllowedTitleRule implements NudgeDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is inconsistent`];
    return [];
  }
}

export class NudgeDigestRequiredUnitRule implements NudgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeDigest): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeDigestRetriesRangeRule implements NudgeDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeDigest): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a nudge digest. */
export class NudgeDigestValidator {
  rules: NudgeDigestRule[];

  constructor(rules: NudgeDigestRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeDigest[]): Map<string, string[]> {
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

export function defaultNudgeDigestValidator(): NudgeDigestValidator {
  return new NudgeDigestValidator(
    [
      new NudgeDigestRequiredDescriptionRule("nudge digest needs a value"),
      new NudgeDigestAllowedTitleRule([]),
      new NudgeDigestRequiredUnitRule("nudge digest needs a value"),
      new NudgeDigestRetriesRangeRule(32, 80),
    ],
  );
}
