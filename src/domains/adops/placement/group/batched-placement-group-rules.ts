import { BatchedPlacementGroup } from "./batched-placement-group.js";

/** A rule a batched placement group must pass. Check returns its problems, or none. */
export interface BatchedPlacementGroupRule {
  check(item: BatchedPlacementGroup): string[];
}

export class BatchedPlacementGroupTitleLengthRule implements BatchedPlacementGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPlacementGroupCodePrefixRule implements BatchedPlacementGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedPlacementGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedPlacementGroupVersionRangeRule implements BatchedPlacementGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPlacementGroup): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPlacementGroupRequiredLocaleRule implements BatchedPlacementGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedPlacementGroup): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedPlacementGroupCodeLengthRule implements BatchedPlacementGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPlacementGroupNotesLengthRule implements BatchedPlacementGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPlacementGroup): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched placement group. */
export class BatchedPlacementGroupValidator {
  rules: BatchedPlacementGroupRule[];

  constructor(rules: BatchedPlacementGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPlacementGroup): string[] {
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

  requireValid(item: BatchedPlacementGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPlacementGroup[]): Map<string, string[]> {
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

export function defaultBatchedPlacementGroupValidator(): BatchedPlacementGroupValidator {
  return new BatchedPlacementGroupValidator(
    [
      new BatchedPlacementGroupTitleLengthRule(3600),
      new BatchedPlacementGroupCodePrefixRule("X"),
      new BatchedPlacementGroupVersionRangeRule(16, 32),
      new BatchedPlacementGroupRequiredLocaleRule("batched placement group needs an entry"),
      new BatchedPlacementGroupCodeLengthRule(80),
      new BatchedPlacementGroupNotesLengthRule(32),
    ],
  );
}
