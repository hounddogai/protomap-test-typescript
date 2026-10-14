import { LegacyWindowDraft } from "./legacy-window-draft.js";

/** A rule a legacy window draft must pass. Check returns its problems, or none. */
export interface LegacyWindowDraftRule {
  check(item: LegacyWindowDraft): string[];
}

export class LegacyWindowDraftCodeLengthRule implements LegacyWindowDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWindowDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyWindowDraftCodePrefixRule implements LegacyWindowDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyWindowDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyWindowDraftBatchSizeRangeRule implements LegacyWindowDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyWindowDraft): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyWindowDraftNameLengthRule implements LegacyWindowDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyWindowDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy window draft. */
export class LegacyWindowDraftValidator {
  rules: LegacyWindowDraftRule[];

  constructor(rules: LegacyWindowDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyWindowDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyWindowDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyWindowDraft[]): Map<string, string[]> {
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

export function defaultLegacyWindowDraftValidator(): LegacyWindowDraftValidator {
  return new LegacyWindowDraftValidator(
    [
      new LegacyWindowDraftCodeLengthRule(1000),
      new LegacyWindowDraftCodePrefixRule("X"),
      new LegacyWindowDraftBatchSizeRangeRule(1000, 3600),
      new LegacyWindowDraftNameLengthRule(64),
    ],
  );
}
