import * as text from "../../../../kit/text.js";
import { GlobalTierDigest } from "./global-tier-digest.js";

/** A rule a global tier digest must pass. Check returns its problems, or none. */
export interface GlobalTierDigestRule {
  check(item: GlobalTierDigest): string[];
}

export class GlobalTierDigestRequiredTitleRule implements GlobalTierDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalTierDigest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalTierDigestAllowedSummaryRule implements GlobalTierDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalTierDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is missing`];
    return [];
  }
}

export class GlobalTierDigestCodeLengthRule implements GlobalTierDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalTierDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalTierDigestCodePrefixRule implements GlobalTierDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalTierDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalTierDigestRequiredCodeRule implements GlobalTierDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalTierDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalTierDigestLabelLengthRule implements GlobalTierDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalTierDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global tier digest. */
export class GlobalTierDigestValidator {
  rules: GlobalTierDigestRule[];

  constructor(rules: GlobalTierDigestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalTierDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalTierDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalTierDigest[]): Map<string, string[]> {
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

export function defaultGlobalTierDigestValidator(): GlobalTierDigestValidator {
  return new GlobalTierDigestValidator(
    [
      new GlobalTierDigestRequiredTitleRule("global tier digest needs this field"),
      new GlobalTierDigestAllowedSummaryRule(["fallback", "batched", "legacy"]),
      new GlobalTierDigestCodeLengthRule(64),
      new GlobalTierDigestCodePrefixRule("REF"),
      new GlobalTierDigestRequiredCodeRule("global tier digest needs a value"),
      new GlobalTierDigestLabelLengthRule(64),
    ],
  );
}
