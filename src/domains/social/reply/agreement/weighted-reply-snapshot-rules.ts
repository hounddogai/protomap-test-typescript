import { WeightedReplySnapshot } from "./weighted-reply-snapshot.js";

/** A rule a weighted reply snapshot must pass. Check returns its problems, or none. */
export interface WeightedReplySnapshotRule {
  check(item: WeightedReplySnapshot): string[];
}

export class WeightedReplySnapshotApprovedGuardRule implements WeightedReplySnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedReplySnapshot): string[] {
    if (item.approved && item.floorValue > this.limit) return [`floor value ${item.floorValue} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class WeightedReplySnapshotNameLengthRule implements WeightedReplySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReplySnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReplySnapshotCodeLengthRule implements WeightedReplySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReplySnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedReplySnapshotRequiredNameRule implements WeightedReplySnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedReplySnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedReplySnapshotSegmentLengthRule implements WeightedReplySnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedReplySnapshot): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted reply snapshot. */
export class WeightedReplySnapshotValidator {
  rules: WeightedReplySnapshotRule[];

  constructor(rules: WeightedReplySnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedReplySnapshot): string[] {
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

  requireValid(item: WeightedReplySnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedReplySnapshot[]): Map<string, string[]> {
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

export function defaultWeightedReplySnapshotValidator(): WeightedReplySnapshotValidator {
  return new WeightedReplySnapshotValidator(
    [
      new WeightedReplySnapshotApprovedGuardRule(7.2),
      new WeightedReplySnapshotNameLengthRule(255),
      new WeightedReplySnapshotCodeLengthRule(1000),
      new WeightedReplySnapshotRequiredNameRule("weighted reply snapshot needs this field"),
      new WeightedReplySnapshotSegmentLengthRule(3600),
    ],
  );
}
