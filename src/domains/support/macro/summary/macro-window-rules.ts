import { MacroWindow } from "./macro-window.js";

/** A rule a macro window must pass. Check returns its problems, or none. */
export interface MacroWindowRule {
  check(item: MacroWindow): string[];
}

export class MacroWindowRequiredLabelRule implements MacroWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class MacroWindowBidRangeRule implements MacroWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroWindow): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MacroWindowJourneyIdLengthRule implements MacroWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroWindow): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroWindowCodePrefixRule implements MacroWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a macro window. */
export class MacroWindowValidator {
  rules: MacroWindowRule[];

  constructor(rules: MacroWindowRule[]) {
    this.rules = rules;
  }

  validate(item: MacroWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroWindow[]): Map<string, string[]> {
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

export function defaultMacroWindowValidator(): MacroWindowValidator {
  return new MacroWindowValidator(
    [
      new MacroWindowRequiredLabelRule("macro window needs this field"),
      new MacroWindowBidRangeRule(4.5, 1159.7),
      new MacroWindowJourneyIdLengthRule(80),
      new MacroWindowCodePrefixRule("OPS"),
    ],
  );
}
