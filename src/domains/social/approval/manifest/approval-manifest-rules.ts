import * as text from "../../../../kit/text.js";
import { ApprovalManifest } from "./approval-manifest.js";

/** A rule a approval manifest must pass. Check returns its problems, or none. */
export interface ApprovalManifestRule {
  check(item: ApprovalManifest): string[];
}

export class ApprovalManifestAllowedNameRule implements ApprovalManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class ApprovalManifestVisibleGuardRule implements ApprovalManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ApprovalManifest): string[] {
    if (item.visible && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ApprovalManifestOpenRateRangeRule implements ApprovalManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalManifest): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a approval manifest. */
export class ApprovalManifestValidator {
  rules: ApprovalManifestRule[];

  constructor(rules: ApprovalManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalManifest): string[] {
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

  requireValid(item: ApprovalManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalManifest[]): Map<string, string[]> {
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

export function defaultApprovalManifestValidator(): ApprovalManifestValidator {
  return new ApprovalManifestValidator(
    [
      new ApprovalManifestAllowedNameRule(["regional", "primary"]),
      new ApprovalManifestVisibleGuardRule(1000),
      new ApprovalManifestOpenRateRangeRule(8, 4269),
    ],
  );
}
