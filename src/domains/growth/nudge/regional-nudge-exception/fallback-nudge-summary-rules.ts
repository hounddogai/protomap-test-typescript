import { FallbackNudgeSummary } from "./fallback-nudge-summary.js";

/** A rule a fallback nudge summary must pass. Check returns its problems, or none. */
export interface FallbackNudgeSummaryRule {
  check(item: FallbackNudgeSummary): string[];
}

export class FallbackNudgeSummaryRequiredLocaleRule implements FallbackNudgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackNudgeSummary): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackNudgeSummaryRequiredCodeRule implements FallbackNudgeSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackNudgeSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackNudgeSummaryTagsLimitRule implements FallbackNudgeSummaryRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: FallbackNudgeSummary): string[] {
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

export class FallbackNudgeSummaryRatioRangeRule implements FallbackNudgeSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackNudgeSummary): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackNudgeSummaryChecksumLengthRule implements FallbackNudgeSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackNudgeSummary): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback nudge summary. */
export class FallbackNudgeSummaryValidator {
  rules: FallbackNudgeSummaryRule[];

  constructor(rules: FallbackNudgeSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackNudgeSummary): string[] {
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

  requireValid(item: FallbackNudgeSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackNudgeSummary[]): Map<string, string[]> {
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

export function defaultFallbackNudgeSummaryValidator(): FallbackNudgeSummaryValidator {
  return new FallbackNudgeSummaryValidator(
    [
      new FallbackNudgeSummaryRequiredLocaleRule("fallback nudge summary needs this field"),
      new FallbackNudgeSummaryRequiredCodeRule("fallback nudge summary needs a value"),
      new FallbackNudgeSummaryTagsLimitRule(16, ["manual", "seasonal"]),
      new FallbackNudgeSummaryRatioRangeRule(1.7, 937.5),
      new FallbackNudgeSummaryChecksumLengthRule(3600),
    ],
  );
}
