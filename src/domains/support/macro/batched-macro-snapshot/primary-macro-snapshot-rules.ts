import { PrimaryMacroSnapshot } from "./primary-macro-snapshot.js";

/** A rule a primary macro snapshot must pass. Check returns its problems, or none. */
export interface PrimaryMacroSnapshotRule {
  check(item: PrimaryMacroSnapshot): string[];
}

export class PrimaryMacroSnapshotTagsLimitRule implements PrimaryMacroSnapshotRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PrimaryMacroSnapshot): string[] {
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

export class PrimaryMacroSnapshotSourceLengthRule implements PrimaryMacroSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryMacroSnapshot): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryMacroSnapshotRequiredSourceRule implements PrimaryMacroSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryMacroSnapshot): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryMacroSnapshotNameLengthRule implements PrimaryMacroSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryMacroSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryMacroSnapshotQuantityRangeRule implements PrimaryMacroSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryMacroSnapshot): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryMacroSnapshotCodePrefixRule implements PrimaryMacroSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryMacroSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary macro snapshot. */
export class PrimaryMacroSnapshotValidator {
  rules: PrimaryMacroSnapshotRule[];

  constructor(rules: PrimaryMacroSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryMacroSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryMacroSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryMacroSnapshot[]): Map<string, string[]> {
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

export function defaultPrimaryMacroSnapshotValidator(): PrimaryMacroSnapshotValidator {
  return new PrimaryMacroSnapshotValidator(
    [
      new PrimaryMacroSnapshotTagsLimitRule(1000, ["rolling", "batched", "scheduled"]),
      new PrimaryMacroSnapshotSourceLengthRule(1000),
      new PrimaryMacroSnapshotRequiredSourceRule("primary macro snapshot needs a value"),
      new PrimaryMacroSnapshotNameLengthRule(86400),
      new PrimaryMacroSnapshotQuantityRangeRule(16, 16),
      new PrimaryMacroSnapshotCodePrefixRule("REF"),
    ],
  );
}
