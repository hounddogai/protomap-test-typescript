import * as text from "../../../../kit/text.js";
import { FallbackFrequencyThreshold } from "./fallback-frequency-threshold.js";

/** A rule a fallback frequency threshold must pass. Check returns its problems, or none. */
export interface FallbackFrequencyThresholdRule {
  check(item: FallbackFrequencyThreshold): string[];
}

export class FallbackFrequencyThresholdTitleLengthRule implements FallbackFrequencyThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFrequencyThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFrequencyThresholdAllowedTitleRule implements FallbackFrequencyThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackFrequencyThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class FallbackFrequencyThresholdRequiredNameRule implements FallbackFrequencyThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFrequencyThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback frequency threshold. */
export class FallbackFrequencyThresholdValidator {
  rules: FallbackFrequencyThresholdRule[];

  constructor(rules: FallbackFrequencyThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFrequencyThreshold): string[] {
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

  requireValid(item: FallbackFrequencyThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFrequencyThreshold[]): Map<string, string[]> {
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

export function defaultFallbackFrequencyThresholdValidator(): FallbackFrequencyThresholdValidator {
  return new FallbackFrequencyThresholdValidator(
    [
      new FallbackFrequencyThresholdTitleLengthRule(64),
      new FallbackFrequencyThresholdAllowedTitleRule(["pending"]),
      new FallbackFrequencyThresholdRequiredNameRule("fallback frequency threshold needs an entry"),
    ],
  );
}
