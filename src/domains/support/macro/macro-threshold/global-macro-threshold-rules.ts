import * as text from "../../../../kit/text.js";
import { GlobalMacroThreshold } from "./global-macro-threshold.js";

/** A rule a global macro threshold must pass. Check returns its problems, or none. */
export interface GlobalMacroThresholdRule {
  check(item: GlobalMacroThreshold): string[];
}

export class GlobalMacroThresholdRatioRangeRule implements GlobalMacroThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalMacroThreshold): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalMacroThresholdArchivedGuardRule implements GlobalMacroThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalMacroThreshold): string[] {
    if (item.archived && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class GlobalMacroThresholdAllowedTitleRule implements GlobalMacroThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalMacroThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class GlobalMacroThresholdCodeLengthRule implements GlobalMacroThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalMacroThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global macro threshold. */
export class GlobalMacroThresholdValidator {
  rules: GlobalMacroThresholdRule[];

  constructor(rules: GlobalMacroThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalMacroThreshold): string[] {
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

  requireValid(item: GlobalMacroThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalMacroThreshold[]): Map<string, string[]> {
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

export function defaultGlobalMacroThresholdValidator(): GlobalMacroThresholdValidator {
  return new GlobalMacroThresholdValidator(
    [
      new GlobalMacroThresholdRatioRangeRule(6.3, 2003.8),
      new GlobalMacroThresholdArchivedGuardRule(7.1),
      new GlobalMacroThresholdAllowedTitleRule(["regional", "batched"]),
      new GlobalMacroThresholdCodeLengthRule(16),
    ],
  );
}
