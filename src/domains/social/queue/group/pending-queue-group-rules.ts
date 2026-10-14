import * as text from "../../../../kit/text.js";
import { PendingQueueGroup } from "./pending-queue-group.js";

/** A rule a pending queue group must pass. Check returns its problems, or none. */
export interface PendingQueueGroupRule {
  check(item: PendingQueueGroup): string[];
}

export class PendingQueueGroupAllowedChecksumRule implements PendingQueueGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingQueueGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is inconsistent`];
    return [];
  }
}

export class PendingQueueGroupRequiredLabelRule implements PendingQueueGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingQueueGroup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingQueueGroupRequiredSegmentRule implements PendingQueueGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingQueueGroup): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class PendingQueueGroupBidRangeRule implements PendingQueueGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingQueueGroup): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending queue group. */
export class PendingQueueGroupValidator {
  rules: PendingQueueGroupRule[];

  constructor(rules: PendingQueueGroupRule[]) {
    this.rules = rules;
  }

  validate(item: PendingQueueGroup): string[] {
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

  requireValid(item: PendingQueueGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingQueueGroup[]): Map<string, string[]> {
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

export function defaultPendingQueueGroupValidator(): PendingQueueGroupValidator {
  return new PendingQueueGroupValidator(
    [
      new PendingQueueGroupAllowedChecksumRule(["scheduled"]),
      new PendingQueueGroupRequiredLabelRule("pending queue group needs a value"),
      new PendingQueueGroupRequiredSegmentRule("pending queue group needs an entry"),
      new PendingQueueGroupBidRangeRule(1.5, 1851.5),
    ],
  );
}
