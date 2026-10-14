import { MacroScore } from "./macro-score.js";

/** A rule a macro score must pass. Check returns its problems, or none. */
export interface MacroScoreRule {
  check(item: MacroScore): string[];
}

export class MacroScoreLabelLengthRule implements MacroScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroScoreTimezoneLengthRule implements MacroScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroScore): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroScoreRequiredNotesRule implements MacroScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroScore): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a macro score. */
export class MacroScoreValidator {
  rules: MacroScoreRule[];

  constructor(rules: MacroScoreRule[]) {
    this.rules = rules;
  }

  validate(item: MacroScore): string[] {
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

  requireValid(item: MacroScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroScore[]): Map<string, string[]> {
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

export function defaultMacroScoreValidator(): MacroScoreValidator {
  return new MacroScoreValidator(
    [
      new MacroScoreLabelLengthRule(255),
      new MacroScoreTimezoneLengthRule(86400),
      new MacroScoreRequiredNotesRule("macro score needs a value"),
    ],
  );
}
