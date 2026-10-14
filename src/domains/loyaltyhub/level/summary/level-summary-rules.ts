import { LevelSummary } from "./level-summary.js";

/** A rule a level summary must pass. Check returns its problems, or none. */
export interface LevelSummaryRule {
  check(item: LevelSummary): string[];
}

export class LevelSummaryCodePrefixRule implements LevelSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LevelSummaryVisibleGuardRule implements LevelSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LevelSummary): string[] {
    if (item.visible && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class LevelSummaryLabelLengthRule implements LevelSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelSummary): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelSummaryCodeLengthRule implements LevelSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelSummary): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelSummaryRequiredNameRule implements LevelSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelSummary): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LevelSummaryTitleLengthRule implements LevelSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level summary. */
export class LevelSummaryValidator {
  rules: LevelSummaryRule[];

  constructor(rules: LevelSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: LevelSummary): string[] {
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

  requireValid(item: LevelSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelSummary[]): Map<string, string[]> {
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

export function defaultLevelSummaryValidator(): LevelSummaryValidator {
  return new LevelSummaryValidator(
    [
      new LevelSummaryCodePrefixRule("OPS"),
      new LevelSummaryVisibleGuardRule(64),
      new LevelSummaryLabelLengthRule(120),
      new LevelSummaryCodeLengthRule(86400),
      new LevelSummaryRequiredNameRule("level summary needs this field"),
      new LevelSummaryTitleLengthRule(1000),
    ],
  );
}
