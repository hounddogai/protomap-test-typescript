import { BatchedBranchManifest } from "./batched-branch-manifest.js";

/** A rule a batched branch manifest must pass. Check returns its problems, or none. */
export interface BatchedBranchManifestRule {
  check(item: BatchedBranchManifest): string[];
}

export class BatchedBranchManifestCodePrefixRule implements BatchedBranchManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedBranchManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedBranchManifestRequiredUnitRule implements BatchedBranchManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedBranchManifest): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedBranchManifestUnitLengthRule implements BatchedBranchManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedBranchManifest): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedBranchManifestRequiredNameRule implements BatchedBranchManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedBranchManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched branch manifest. */
export class BatchedBranchManifestValidator {
  rules: BatchedBranchManifestRule[];

  constructor(rules: BatchedBranchManifestRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedBranchManifest): string[] {
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

  requireValid(item: BatchedBranchManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedBranchManifest[]): Map<string, string[]> {
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

export function defaultBatchedBranchManifestValidator(): BatchedBranchManifestValidator {
  return new BatchedBranchManifestValidator(
    [
      new BatchedBranchManifestCodePrefixRule("X"),
      new BatchedBranchManifestRequiredUnitRule("batched branch manifest needs a value"),
      new BatchedBranchManifestUnitLengthRule(86400),
      new BatchedBranchManifestRequiredNameRule("batched branch manifest needs this field"),
    ],
  );
}
