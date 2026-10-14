import * as text from "../../../../kit/text.js";
import { SenderRollup } from "./sender-rollup.js";

/** A rule a sender rollup must pass. Check returns its problems, or none. */
export interface SenderRollupRule {
  check(item: SenderRollup): string[];
}

export class SenderRollupAllowedTitleRule implements SenderRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class SenderRollupCohortLengthRule implements SenderRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderRollup): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderRollupPinnedGuardRule implements SenderRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SenderRollup): string[] {
    if (item.pinned && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class SenderRollupExternalRefLengthRule implements SenderRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderRollup): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sender rollup. */
export class SenderRollupValidator {
  rules: SenderRollupRule[];

  constructor(rules: SenderRollupRule[]) {
    this.rules = rules;
  }

  validate(item: SenderRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderRollup[]): Map<string, string[]> {
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

export function defaultSenderRollupValidator(): SenderRollupValidator {
  return new SenderRollupValidator(
    [
      new SenderRollupAllowedTitleRule(["batched", "default", "seasonal"]),
      new SenderRollupCohortLengthRule(1000),
      new SenderRollupPinnedGuardRule(3600),
      new SenderRollupExternalRefLengthRule(1000),
    ],
  );
}
