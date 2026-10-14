import { PendingBranchManifest } from "./pending-branch-manifest.js";

/** A rule a pending branch manifest must pass. Check returns its problems, or none. */
export interface PendingBranchManifestRule {
  check(item: PendingBranchManifest): string[];
}

export class PendingBranchManifestCodeLengthRule implements PendingBranchManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBranchManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBranchManifestCodePrefixRule implements PendingBranchManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingBranchManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingBranchManifestDiscountRangeRule implements PendingBranchManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBranchManifest): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBranchManifestCountryLengthRule implements PendingBranchManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBranchManifest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBranchManifestSegmentLengthRule implements PendingBranchManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBranchManifest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending branch manifest. */
export class PendingBranchManifestValidator {
  rules: PendingBranchManifestRule[];

  constructor(rules: PendingBranchManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBranchManifest): string[] {
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

  requireValid(item: PendingBranchManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBranchManifest[]): Map<string, string[]> {
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

export function defaultPendingBranchManifestValidator(): PendingBranchManifestValidator {
  return new PendingBranchManifestValidator(
    [
      new PendingBranchManifestCodeLengthRule(86400),
      new PendingBranchManifestCodePrefixRule("X"),
      new PendingBranchManifestDiscountRangeRule(4, 172.6),
      new PendingBranchManifestCountryLengthRule(86400),
      new PendingBranchManifestSegmentLengthRule(255),
    ],
  );
}
