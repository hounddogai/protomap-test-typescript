import { RollingPayoutBatch } from "./rolling-payout-batch.js";

/** A rule a rolling payout batch must pass. Check returns its problems, or none. */
export interface RollingPayoutBatchRule {
  check(item: RollingPayoutBatch): string[];
}

export class RollingPayoutBatchVisibleGuardRule implements RollingPayoutBatchRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingPayoutBatch): string[] {
    if (item.visible && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class RollingPayoutBatchRequiredChecksumRule implements RollingPayoutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPayoutBatch): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPayoutBatchTagsLimitRule implements RollingPayoutBatchRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: RollingPayoutBatch): string[] {
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

export class RollingPayoutBatchRequiredCodeRule implements RollingPayoutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPayoutBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling payout batch. */
export class RollingPayoutBatchValidator {
  rules: RollingPayoutBatchRule[];

  constructor(rules: RollingPayoutBatchRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPayoutBatch): string[] {
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

  requireValid(item: RollingPayoutBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPayoutBatch[]): Map<string, string[]> {
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

export function defaultRollingPayoutBatchValidator(): RollingPayoutBatchValidator {
  return new RollingPayoutBatchValidator(
    [
      new RollingPayoutBatchVisibleGuardRule(32),
      new RollingPayoutBatchRequiredChecksumRule("rolling payout batch needs this field"),
      new RollingPayoutBatchTagsLimitRule(120, ["adaptive"]),
      new RollingPayoutBatchRequiredCodeRule("rolling payout batch needs an entry"),
    ],
  );
}
