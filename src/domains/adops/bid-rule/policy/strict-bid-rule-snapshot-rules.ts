import * as text from "../../../../kit/text.js";
import { StrictBidRuleSnapshot } from "./strict-bid-rule-snapshot.js";

/** A rule a strict bid rule snapshot must pass. Check returns its problems, or none. */
export interface StrictBidRuleSnapshotRule {
  check(item: StrictBidRuleSnapshot): string[];
}

export class StrictBidRuleSnapshotRequiredCodeRule implements StrictBidRuleSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBidRuleSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBidRuleSnapshotRequiredTitleRule implements StrictBidRuleSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBidRuleSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBidRuleSnapshotAllowedTitleRule implements StrictBidRuleSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictBidRuleSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

/** Runs every rule of a strict bid rule snapshot. */
export class StrictBidRuleSnapshotValidator {
  rules: StrictBidRuleSnapshotRule[];

  constructor(rules: StrictBidRuleSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBidRuleSnapshot): string[] {
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

  requireValid(item: StrictBidRuleSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBidRuleSnapshot[]): Map<string, string[]> {
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

export function defaultStrictBidRuleSnapshotValidator(): StrictBidRuleSnapshotValidator {
  return new StrictBidRuleSnapshotValidator(
    [
      new StrictBidRuleSnapshotRequiredCodeRule("strict bid rule snapshot needs this field"),
      new StrictBidRuleSnapshotRequiredTitleRule("strict bid rule snapshot needs this field"),
      new StrictBidRuleSnapshotAllowedTitleRule(["fallback", "lenient", "primary"]),
    ],
  );
}
