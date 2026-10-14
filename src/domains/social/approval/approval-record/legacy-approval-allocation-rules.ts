import * as text from "../../../../kit/text.js";
import { LegacyApprovalAllocation } from "./legacy-approval-allocation.js";

/** A rule a legacy approval allocation must pass. Check returns its problems, or none. */
export interface LegacyApprovalAllocationRule {
  check(item: LegacyApprovalAllocation): string[];
}

export class LegacyApprovalAllocationTagsLimitRule implements LegacyApprovalAllocationRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LegacyApprovalAllocation): string[] {
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

export class LegacyApprovalAllocationRequiredRegionRule implements LegacyApprovalAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyApprovalAllocation): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyApprovalAllocationAllowedLabelRule implements LegacyApprovalAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyApprovalAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class LegacyApprovalAllocationCodeLengthRule implements LegacyApprovalAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyApprovalAllocation): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy approval allocation. */
export class LegacyApprovalAllocationValidator {
  rules: LegacyApprovalAllocationRule[];

  constructor(rules: LegacyApprovalAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyApprovalAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyApprovalAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyApprovalAllocation[]): Map<string, string[]> {
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

export function defaultLegacyApprovalAllocationValidator(): LegacyApprovalAllocationValidator {
  return new LegacyApprovalAllocationValidator(
    [
      new LegacyApprovalAllocationTagsLimitRule(86400, ["fallback", "batched", "capped"]),
      new LegacyApprovalAllocationRequiredRegionRule("legacy approval allocation needs this field"),
      new LegacyApprovalAllocationAllowedLabelRule([]),
      new LegacyApprovalAllocationCodeLengthRule(16),
    ],
  );
}
