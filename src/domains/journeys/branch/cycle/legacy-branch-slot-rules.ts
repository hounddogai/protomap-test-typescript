import * as text from "../../../../kit/text.js";
import { LegacyBranchSlot } from "./legacy-branch-slot.js";

/** A rule a legacy branch slot must pass. Check returns its problems, or none. */
export interface LegacyBranchSlotRule {
  check(item: LegacyBranchSlot): string[];
}

export class LegacyBranchSlotRequiredCohortRule implements LegacyBranchSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBranchSlot): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBranchSlotRequiredTitleRule implements LegacyBranchSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyBranchSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyBranchSlotTitleLengthRule implements LegacyBranchSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyBranchSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyBranchSlotCodePrefixRule implements LegacyBranchSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyBranchSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyBranchSlotAllowedCohortRule implements LegacyBranchSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyBranchSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is stale`];
    return [];
  }
}

/** Runs every rule of a legacy branch slot. */
export class LegacyBranchSlotValidator {
  rules: LegacyBranchSlotRule[];

  constructor(rules: LegacyBranchSlotRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyBranchSlot): string[] {
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

  requireValid(item: LegacyBranchSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyBranchSlot[]): Map<string, string[]> {
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

export function defaultLegacyBranchSlotValidator(): LegacyBranchSlotValidator {
  return new LegacyBranchSlotValidator(
    [
      new LegacyBranchSlotRequiredCohortRule("legacy branch slot needs an entry"),
      new LegacyBranchSlotRequiredTitleRule("legacy branch slot needs an entry"),
      new LegacyBranchSlotTitleLengthRule(86400),
      new LegacyBranchSlotCodePrefixRule("X"),
      new LegacyBranchSlotAllowedCohortRule(["global"]),
    ],
  );
}
