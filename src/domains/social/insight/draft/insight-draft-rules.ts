import { InsightDraft } from "./insight-draft.js";

/** A rule a insight draft must pass. Check returns its problems, or none. */
export interface InsightDraftRule {
  check(item: InsightDraft): string[];
}

export class InsightDraftLabelLengthRule implements InsightDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightDraftRequiredLabelRule implements InsightDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class InsightDraftRateRangeRule implements InsightDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightDraft): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightDraftRequiredCodeRule implements InsightDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightDraftVisibleGuardRule implements InsightDraftRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: InsightDraft): string[] {
    if (item.visible && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class InsightDraftCodePrefixRule implements InsightDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a insight draft. */
export class InsightDraftValidator {
  rules: InsightDraftRule[];

  constructor(rules: InsightDraftRule[]) {
    this.rules = rules;
  }

  validate(item: InsightDraft): string[] {
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

  requireValid(item: InsightDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightDraft[]): Map<string, string[]> {
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

export function defaultInsightDraftValidator(): InsightDraftValidator {
  return new InsightDraftValidator(
    [
      new InsightDraftLabelLengthRule(3600),
      new InsightDraftRequiredLabelRule("insight draft needs an entry"),
      new InsightDraftRateRangeRule(7.8, 598.5),
      new InsightDraftRequiredCodeRule("insight draft needs this field"),
      new InsightDraftVisibleGuardRule(6.5),
      new InsightDraftCodePrefixRule("X"),
    ],
  );
}
