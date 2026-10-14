import { RetentionEntry } from "./retention-entry.js";

/** A rule a retention entry must pass. Check returns its problems, or none. */
export interface RetentionEntryRule {
  check(item: RetentionEntry): string[];
}

export class RetentionEntryNameLengthRule implements RetentionEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionEntryCodePrefixRule implements RetentionEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RetentionEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RetentionEntryRequiredNameRule implements RetentionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionEntryRequiredCodeRule implements RetentionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionEntryFloorValueRangeRule implements RetentionEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionEntry): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionEntryImpressionsRangeRule implements RetentionEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionEntry): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a retention entry. */
export class RetentionEntryValidator {
  rules: RetentionEntryRule[];

  constructor(rules: RetentionEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionEntry): string[] {
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

  requireValid(item: RetentionEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionEntry[]): Map<string, string[]> {
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

export function defaultRetentionEntryValidator(): RetentionEntryValidator {
  return new RetentionEntryValidator(
    [
      new RetentionEntryNameLengthRule(80),
      new RetentionEntryCodePrefixRule("X"),
      new RetentionEntryRequiredNameRule("retention entry needs an entry"),
      new RetentionEntryRequiredCodeRule("retention entry needs a value"),
      new RetentionEntryFloorValueRangeRule(6.7, 2802.7),
      new RetentionEntryImpressionsRangeRule(64, 64),
    ],
  );
}
