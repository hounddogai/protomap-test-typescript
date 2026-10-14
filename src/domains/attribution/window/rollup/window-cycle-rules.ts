import * as text from "../../../../kit/text.js";
import { WindowCycle } from "./window-cycle.js";

/** A rule a window cycle must pass. Check returns its problems, or none. */
export interface WindowCycleRule {
  check(item: WindowCycle): string[];
}

export class WindowCycleCodePrefixRule implements WindowCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowCycleTitleLengthRule implements WindowCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowCycleRequiredCodeRule implements WindowCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WindowCycleDurationMinutesRangeRule implements WindowCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowCycle): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowCycleAllowedCodeRule implements WindowCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class WindowCycleRequiredTitleRule implements WindowCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowCycle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window cycle. */
export class WindowCycleValidator {
  rules: WindowCycleRule[];

  constructor(rules: WindowCycleRule[]) {
    this.rules = rules;
  }

  validate(item: WindowCycle): string[] {
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

  requireValid(item: WindowCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowCycle[]): Map<string, string[]> {
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

export function defaultWindowCycleValidator(): WindowCycleValidator {
  return new WindowCycleValidator(
    [
      new WindowCycleCodePrefixRule("REF"),
      new WindowCycleTitleLengthRule(32),
      new WindowCycleRequiredCodeRule("window cycle needs a value"),
      new WindowCycleDurationMinutesRangeRule(16, 80),
      new WindowCycleAllowedCodeRule(["legacy", "manual"]),
      new WindowCycleRequiredTitleRule("window cycle needs this field"),
    ],
  );
}
