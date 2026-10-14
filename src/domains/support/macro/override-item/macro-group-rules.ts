import { MacroGroup } from "./macro-group.js";

/** A rule a macro group must pass. Check returns its problems, or none. */
export interface MacroGroupRule {
  check(item: MacroGroup): string[];
}

export class MacroGroupNameLengthRule implements MacroGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroGroupDescriptionLengthRule implements MacroGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroGroup): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroGroupRequiredCodeRule implements MacroGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroGroupActiveGuardRule implements MacroGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: MacroGroup): string[] {
    if (item.active && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while active`];
    return [];
  }
}

export class MacroGroupFrequencyCapRangeRule implements MacroGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroGroup): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a macro group. */
export class MacroGroupValidator {
  rules: MacroGroupRule[];

  constructor(rules: MacroGroupRule[]) {
    this.rules = rules;
  }

  validate(item: MacroGroup): string[] {
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

  requireValid(item: MacroGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroGroup[]): Map<string, string[]> {
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

export function defaultMacroGroupValidator(): MacroGroupValidator {
  return new MacroGroupValidator(
    [
      new MacroGroupNameLengthRule(3600),
      new MacroGroupDescriptionLengthRule(32),
      new MacroGroupRequiredCodeRule("macro group needs an entry"),
      new MacroGroupActiveGuardRule(120),
      new MacroGroupFrequencyCapRangeRule(16, 1000),
    ],
  );
}
