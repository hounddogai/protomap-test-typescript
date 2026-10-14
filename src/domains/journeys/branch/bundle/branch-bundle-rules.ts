import { BranchBundle } from "./branch-bundle.js";

/** A rule a branch bundle must pass. Check returns its problems, or none. */
export interface BranchBundleRule {
  check(item: BranchBundle): string[];
}

export class BranchBundleCodeLengthRule implements BranchBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchBundleExternalRefLengthRule implements BranchBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchBundle): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchBundleCodePrefixRule implements BranchBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a branch bundle. */
export class BranchBundleValidator {
  rules: BranchBundleRule[];

  constructor(rules: BranchBundleRule[]) {
    this.rules = rules;
  }

  validate(item: BranchBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchBundle[]): Map<string, string[]> {
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

export function defaultBranchBundleValidator(): BranchBundleValidator {
  return new BranchBundleValidator(
    [
      new BranchBundleCodeLengthRule(120),
      new BranchBundleExternalRefLengthRule(16),
      new BranchBundleCodePrefixRule("Q"),
    ],
  );
}
