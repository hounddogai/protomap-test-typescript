import { SenderSnapshot } from "./sender-snapshot.js";

/** A rule a sender snapshot must pass. Check returns its problems, or none. */
export interface SenderSnapshotRule {
  check(item: SenderSnapshot): string[];
}

export class SenderSnapshotRequiredSegmentRule implements SenderSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderSnapshot): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class SenderSnapshotCohortLengthRule implements SenderSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderSnapshot): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderSnapshotCodePrefixRule implements SenderSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SenderSnapshotRequiredLabelRule implements SenderSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sender snapshot. */
export class SenderSnapshotValidator {
  rules: SenderSnapshotRule[];

  constructor(rules: SenderSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: SenderSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderSnapshot[]): Map<string, string[]> {
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

export function defaultSenderSnapshotValidator(): SenderSnapshotValidator {
  return new SenderSnapshotValidator(
    [
      new SenderSnapshotRequiredSegmentRule("sender snapshot needs a value"),
      new SenderSnapshotCohortLengthRule(16),
      new SenderSnapshotCodePrefixRule("ACM"),
      new SenderSnapshotRequiredLabelRule("sender snapshot needs a value"),
    ],
  );
}
