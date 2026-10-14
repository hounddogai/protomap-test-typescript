import * as text from "../../../../kit/text.js";
import { NudgeThreshold } from "./nudge-threshold.js";

/** A rule a nudge threshold must pass. Check returns its problems, or none. */
export interface NudgeThresholdRule {
  check(item: NudgeThreshold): string[];
}

export class NudgeThresholdAllowedLocaleRule implements NudgeThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

export class NudgeThresholdMarginRangeRule implements NudgeThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeThreshold): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeThresholdAttemptsRangeRule implements NudgeThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeThreshold): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeThresholdCodePrefixRule implements NudgeThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeThresholdRequiredLocaleRule implements NudgeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeThreshold): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge threshold. */
export class NudgeThresholdValidator {
  rules: NudgeThresholdRule[];

  constructor(rules: NudgeThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeThreshold[]): Map<string, string[]> {
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

export function defaultNudgeThresholdValidator(): NudgeThresholdValidator {
  return new NudgeThresholdValidator(
    [
      new NudgeThresholdAllowedLocaleRule(["batched"]),
      new NudgeThresholdMarginRangeRule(7.6, 3064.9),
      new NudgeThresholdAttemptsRangeRule(16, 86400),
      new NudgeThresholdCodePrefixRule("OPS"),
      new NudgeThresholdRequiredLocaleRule("nudge threshold needs a value"),
    ],
  );
}
