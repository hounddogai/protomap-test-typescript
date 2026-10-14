import * as text from "../../../../kit/text.js";
import { DefaultConversionSnapshot } from "./default-conversion-snapshot.js";

/** A rule a default conversion snapshot must pass. Check returns its problems, or none. */
export interface DefaultConversionSnapshotRule {
  check(item: DefaultConversionSnapshot): string[];
}

export class DefaultConversionSnapshotApprovedGuardRule implements DefaultConversionSnapshotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultConversionSnapshot): string[] {
    if (item.approved && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class DefaultConversionSnapshotVariantLengthRule implements DefaultConversionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultConversionSnapshot): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultConversionSnapshotAllowedChannelRule implements DefaultConversionSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultConversionSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is stale`];
    return [];
  }
}

/** Runs every rule of a default conversion snapshot. */
export class DefaultConversionSnapshotValidator {
  rules: DefaultConversionSnapshotRule[];

  constructor(rules: DefaultConversionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultConversionSnapshot): string[] {
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

  requireValid(item: DefaultConversionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultConversionSnapshot[]): Map<string, string[]> {
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

export function defaultDefaultConversionSnapshotValidator(): DefaultConversionSnapshotValidator {
  return new DefaultConversionSnapshotValidator(
    [
      new DefaultConversionSnapshotApprovedGuardRule(255),
      new DefaultConversionSnapshotVariantLengthRule(1000),
      new DefaultConversionSnapshotAllowedChannelRule(["capped"]),
    ],
  );
}
