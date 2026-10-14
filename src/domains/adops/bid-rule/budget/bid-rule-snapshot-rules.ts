import * as text from "../../../../kit/text.js";
import { BidRuleSnapshot } from "./bid-rule-snapshot.js";

/** A rule a bid rule snapshot must pass. Check returns its problems, or none. */
export interface BidRuleSnapshotRule {
  check(item: BidRuleSnapshot): string[];
}

export class BidRuleSnapshotBidRangeRule implements BidRuleSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleSnapshot): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BidRuleSnapshotAllowedAudienceIdRule implements BidRuleSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BidRuleSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is out of range`];
    return [];
  }
}

export class BidRuleSnapshotCodePrefixRule implements BidRuleSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleSnapshotRequiredLocaleRule implements BidRuleSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleSnapshot): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleSnapshotRequiredCodeRule implements BidRuleSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleSnapshotDurationMinutesRangeRule implements BidRuleSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BidRuleSnapshot): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a bid rule snapshot. */
export class BidRuleSnapshotValidator {
  rules: BidRuleSnapshotRule[];

  constructor(rules: BidRuleSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleSnapshot): string[] {
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

  requireValid(item: BidRuleSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleSnapshot[]): Map<string, string[]> {
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

export function defaultBidRuleSnapshotValidator(): BidRuleSnapshotValidator {
  return new BidRuleSnapshotValidator(
    [
      new BidRuleSnapshotBidRangeRule(3.7, 4768.1),
      new BidRuleSnapshotAllowedAudienceIdRule(["weighted", "batched"]),
      new BidRuleSnapshotCodePrefixRule("REF"),
      new BidRuleSnapshotRequiredLocaleRule("bid rule snapshot needs an entry"),
      new BidRuleSnapshotRequiredCodeRule("bid rule snapshot needs a value"),
      new BidRuleSnapshotDurationMinutesRangeRule(32, 3600),
    ],
  );
}
