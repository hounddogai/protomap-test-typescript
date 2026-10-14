import * as text from "../../../../kit/text.js";
import { QueueBaseline } from "./queue-baseline.js";

/** A rule a queue baseline must pass. Check returns its problems, or none. */
export interface QueueBaselineRule {
  check(item: QueueBaseline): string[];
}

export class QueueBaselineTagsLimitRule implements QueueBaselineRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: QueueBaseline): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class QueueBaselineRequiredTitleRule implements QueueBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class QueueBaselineRequiredCodeRule implements QueueBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class QueueBaselineVisibleGuardRule implements QueueBaselineRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: QueueBaseline): string[] {
    if (item.visible && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class QueueBaselineAllowedChecksumRule implements QueueBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is duplicated`];
    return [];
  }
}

/** Runs every rule of a queue baseline. */
export class QueueBaselineValidator {
  rules: QueueBaselineRule[];

  constructor(rules: QueueBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: QueueBaseline): string[] {
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

  requireValid(item: QueueBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueBaseline[]): Map<string, string[]> {
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

export function defaultQueueBaselineValidator(): QueueBaselineValidator {
  return new QueueBaselineValidator(
    [
      new QueueBaselineTagsLimitRule(3600, ["strict"]),
      new QueueBaselineRequiredTitleRule("queue baseline needs this field"),
      new QueueBaselineRequiredCodeRule("queue baseline needs an entry"),
      new QueueBaselineVisibleGuardRule(255),
      new QueueBaselineAllowedChecksumRule([]),
    ],
  );
}
