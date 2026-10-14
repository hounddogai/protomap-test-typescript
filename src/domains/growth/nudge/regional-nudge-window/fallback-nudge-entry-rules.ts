import * as text from "../../../../kit/text.js";
import { FallbackNudgeEntry } from "./fallback-nudge-entry.js";

/** A rule a fallback nudge entry must pass. Check returns its problems, or none. */
export interface FallbackNudgeEntryRule {
  check(item: FallbackNudgeEntry): string[];
}

export class FallbackNudgeEntryAllowedNameRule implements FallbackNudgeEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackNudgeEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class FallbackNudgeEntryRequiredNameRule implements FallbackNudgeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackNudgeEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackNudgeEntryNameLengthRule implements FallbackNudgeEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackNudgeEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackNudgeEntryDurationMinutesRangeRule implements FallbackNudgeEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackNudgeEntry): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fallback nudge entry. */
export class FallbackNudgeEntryValidator {
  rules: FallbackNudgeEntryRule[];

  constructor(rules: FallbackNudgeEntryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackNudgeEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackNudgeEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackNudgeEntry[]): Map<string, string[]> {
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

export function defaultFallbackNudgeEntryValidator(): FallbackNudgeEntryValidator {
  return new FallbackNudgeEntryValidator(
    [
      new FallbackNudgeEntryAllowedNameRule(["scheduled", "strict", "adaptive"]),
      new FallbackNudgeEntryRequiredNameRule("fallback nudge entry needs an entry"),
      new FallbackNudgeEntryNameLengthRule(80),
      new FallbackNudgeEntryDurationMinutesRangeRule(16, 80),
    ],
  );
}
