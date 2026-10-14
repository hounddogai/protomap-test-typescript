import * as text from "../../../../kit/text.js";
import { BatchedPlacementEntry } from "./batched-placement-entry.js";

/** A rule a batched placement entry must pass. Check returns its problems, or none. */
export interface BatchedPlacementEntryRule {
  check(item: BatchedPlacementEntry): string[];
}

export class BatchedPlacementEntryVisibleGuardRule implements BatchedPlacementEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedPlacementEntry): string[] {
    if (item.visible && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class BatchedPlacementEntryCohortLengthRule implements BatchedPlacementEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementEntry): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPlacementEntryNameLengthRule implements BatchedPlacementEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPlacementEntryAllowedCohortRule implements BatchedPlacementEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedPlacementEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is missing`];
    return [];
  }
}

/** Runs every rule of a batched placement entry. */
export class BatchedPlacementEntryValidator {
  rules: BatchedPlacementEntryRule[];

  constructor(rules: BatchedPlacementEntryRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPlacementEntry): string[] {
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

  requireValid(item: BatchedPlacementEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPlacementEntry[]): Map<string, string[]> {
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

export function defaultBatchedPlacementEntryValidator(): BatchedPlacementEntryValidator {
  return new BatchedPlacementEntryValidator(
    [
      new BatchedPlacementEntryVisibleGuardRule(6.5),
      new BatchedPlacementEntryCohortLengthRule(3600),
      new BatchedPlacementEntryNameLengthRule(86400),
      new BatchedPlacementEntryAllowedCohortRule([]),
    ],
  );
}
