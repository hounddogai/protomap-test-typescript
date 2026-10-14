import { MacroThreshold } from "./macro-threshold.js";

/** A rule a macro threshold must pass. Check returns its problems, or none. */
export interface MacroThresholdRule {
  check(item: MacroThreshold): string[];
}

export class MacroThresholdNotesLengthRule implements MacroThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroThreshold): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroThresholdStartsAtRangeRule implements MacroThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroThreshold): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroThresholdRequiredNotesRule implements MacroThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroThreshold): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class MacroThresholdTitleLengthRule implements MacroThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroThresholdLimitRangeRule implements MacroThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroThreshold): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a macro threshold. */
export class MacroThresholdValidator {
  rules: MacroThresholdRule[];

  constructor(rules: MacroThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: MacroThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroThreshold[]): Map<string, string[]> {
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

export function defaultMacroThresholdValidator(): MacroThresholdValidator {
  return new MacroThresholdValidator(
    [
      new MacroThresholdNotesLengthRule(1000),
      new MacroThresholdStartsAtRangeRule(1000, 1000),
      new MacroThresholdRequiredNotesRule("macro threshold needs an entry"),
      new MacroThresholdTitleLengthRule(255),
      new MacroThresholdLimitRangeRule(255, 86400),
    ],
  );
}
