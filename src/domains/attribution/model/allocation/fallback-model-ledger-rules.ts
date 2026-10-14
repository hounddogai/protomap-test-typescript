import * as text from "../../../../kit/text.js";
import { FallbackModelLedger } from "./fallback-model-ledger.js";

/** A rule a fallback model ledger must pass. Check returns its problems, or none. */
export interface FallbackModelLedgerRule {
  check(item: FallbackModelLedger): string[];
}

export class FallbackModelLedgerVisibleGuardRule implements FallbackModelLedgerRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackModelLedger): string[] {
    if (item.visible && item.floorValue > this.limit) return [`floor value ${item.floorValue} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class FallbackModelLedgerUpdatedAtRangeRule implements FallbackModelLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackModelLedger): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackModelLedgerTagsLimitRule implements FallbackModelLedgerRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: FallbackModelLedger): string[] {
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

export class FallbackModelLedgerFloorValueRangeRule implements FallbackModelLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackModelLedger): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackModelLedgerRequiredChecksumRule implements FallbackModelLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackModelLedger): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackModelLedgerAllowedChecksumRule implements FallbackModelLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackModelLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is duplicated`];
    return [];
  }
}

/** Runs every rule of a fallback model ledger. */
export class FallbackModelLedgerValidator {
  rules: FallbackModelLedgerRule[];

  constructor(rules: FallbackModelLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackModelLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackModelLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackModelLedger[]): Map<string, string[]> {
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

export function defaultFallbackModelLedgerValidator(): FallbackModelLedgerValidator {
  return new FallbackModelLedgerValidator(
    [
      new FallbackModelLedgerVisibleGuardRule(3.2),
      new FallbackModelLedgerUpdatedAtRangeRule(80, 120),
      new FallbackModelLedgerTagsLimitRule(16, ["batched"]),
      new FallbackModelLedgerFloorValueRangeRule(7.9, 4130.4),
      new FallbackModelLedgerRequiredChecksumRule("fallback model ledger needs an entry"),
      new FallbackModelLedgerAllowedChecksumRule([]),
    ],
  );
}
