import * as text from "../../../../kit/text.js";
import { ManualSubscriptionSnapshot } from "./manual-subscription-snapshot.js";

/** A rule a manual subscription snapshot must pass. Check returns its problems, or none. */
export interface ManualSubscriptionSnapshotRule {
  check(item: ManualSubscriptionSnapshot): string[];
}

export class ManualSubscriptionSnapshotRequiredCodeRule implements ManualSubscriptionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualSubscriptionSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualSubscriptionSnapshotAllowedOwnerIdRule implements ManualSubscriptionSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualSubscriptionSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is out of range`];
    return [];
  }
}

export class ManualSubscriptionSnapshotCodePrefixRule implements ManualSubscriptionSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualSubscriptionSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualSubscriptionSnapshotBatchSizeRangeRule implements ManualSubscriptionSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualSubscriptionSnapshot): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualSubscriptionSnapshotTitleLengthRule implements ManualSubscriptionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualSubscriptionSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual subscription snapshot. */
export class ManualSubscriptionSnapshotValidator {
  rules: ManualSubscriptionSnapshotRule[];

  constructor(rules: ManualSubscriptionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ManualSubscriptionSnapshot): string[] {
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

  requireValid(item: ManualSubscriptionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualSubscriptionSnapshot[]): Map<string, string[]> {
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

export function defaultManualSubscriptionSnapshotValidator(): ManualSubscriptionSnapshotValidator {
  return new ManualSubscriptionSnapshotValidator(
    [
      new ManualSubscriptionSnapshotRequiredCodeRule("manual subscription snapshot needs a value"),
      new ManualSubscriptionSnapshotAllowedOwnerIdRule(["strict", "batched", "scheduled"]),
      new ManualSubscriptionSnapshotCodePrefixRule("X"),
      new ManualSubscriptionSnapshotBatchSizeRangeRule(80, 3600),
      new ManualSubscriptionSnapshotTitleLengthRule(32),
    ],
  );
}
