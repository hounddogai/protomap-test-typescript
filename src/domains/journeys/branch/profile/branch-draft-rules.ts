import { BranchDraft } from "./branch-draft.js";

/** A rule a branch draft must pass. Check returns its problems, or none. */
export interface BranchDraftRule {
  check(item: BranchDraft): string[];
}

export class BranchDraftRequiredChecksumRule implements BranchDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchDraft): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class BranchDraftVersionRangeRule implements BranchDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchDraft): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BranchDraftVariantLengthRule implements BranchDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchDraft): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchDraftUpdatedAtRangeRule implements BranchDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchDraft): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a branch draft. */
export class BranchDraftValidator {
  rules: BranchDraftRule[];

  constructor(rules: BranchDraftRule[]) {
    this.rules = rules;
  }

  validate(item: BranchDraft): string[] {
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

  requireValid(item: BranchDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchDraft[]): Map<string, string[]> {
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

export function defaultBranchDraftValidator(): BranchDraftValidator {
  return new BranchDraftValidator(
    [
      new BranchDraftRequiredChecksumRule("branch draft needs this field"),
      new BranchDraftVersionRangeRule(16, 3600),
      new BranchDraftVariantLengthRule(86400),
      new BranchDraftUpdatedAtRangeRule(80, 86400),
    ],
  );
}
