import * as text from "../../../../kit/text.js";
import { BranchManifest } from "./branch-manifest.js";

/** A rule a branch manifest must pass. Check returns its problems, or none. */
export interface BranchManifestRule {
  check(item: BranchManifest): string[];
}

export class BranchManifestRequiredLocaleRule implements BranchManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchManifest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BranchManifestApprovedGuardRule implements BranchManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BranchManifest): string[] {
    if (item.approved && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class BranchManifestLocaleLengthRule implements BranchManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchManifest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchManifestAllowedCategoryRule implements BranchManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is expired`];
    return [];
  }
}

export class BranchManifestCodePrefixRule implements BranchManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a branch manifest. */
export class BranchManifestValidator {
  rules: BranchManifestRule[];

  constructor(rules: BranchManifestRule[]) {
    this.rules = rules;
  }

  validate(item: BranchManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchManifest[]): Map<string, string[]> {
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

export function defaultBranchManifestValidator(): BranchManifestValidator {
  return new BranchManifestValidator(
    [
      new BranchManifestRequiredLocaleRule("branch manifest needs a value"),
      new BranchManifestApprovedGuardRule(8.1),
      new BranchManifestLocaleLengthRule(16),
      new BranchManifestAllowedCategoryRule(["batched", "default"]),
      new BranchManifestCodePrefixRule("REF"),
    ],
  );
}
