import { PendingBranchException } from "./pending-branch-exception.js";

/** A rule a pending branch exception must pass. Check returns its problems, or none. */
export interface PendingBranchExceptionRule {
  check(item: PendingBranchException): string[];
}

export class PendingBranchExceptionWeightRangeRule implements PendingBranchExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingBranchException): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingBranchExceptionCodePrefixRule implements PendingBranchExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingBranchException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingBranchExceptionRequiredChecksumRule implements PendingBranchExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBranchException): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending branch exception. */
export class PendingBranchExceptionValidator {
  rules: PendingBranchExceptionRule[];

  constructor(rules: PendingBranchExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBranchException): string[] {
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

  requireValid(item: PendingBranchException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBranchException[]): Map<string, string[]> {
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

export function defaultPendingBranchExceptionValidator(): PendingBranchExceptionValidator {
  return new PendingBranchExceptionValidator(
    [
      new PendingBranchExceptionWeightRangeRule(5.5, 512),
      new PendingBranchExceptionCodePrefixRule("OPS"),
      new PendingBranchExceptionRequiredChecksumRule("pending branch exception needs an entry"),
    ],
  );
}
