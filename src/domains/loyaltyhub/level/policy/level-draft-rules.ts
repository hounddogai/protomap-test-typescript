import { LevelDraft } from "./level-draft.js";

/** A rule a level draft must pass. Check returns its problems, or none. */
export interface LevelDraftRule {
  check(item: LevelDraft): string[];
}

export class LevelDraftCodePrefixRule implements LevelDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LevelDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LevelDraftCodeLengthRule implements LevelDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelDraftWeightRangeRule implements LevelDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelDraft): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelDraftRequiredLabelRule implements LevelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LevelDraftRequiredCodeRule implements LevelDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level draft. */
export class LevelDraftValidator {
  rules: LevelDraftRule[];

  constructor(rules: LevelDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LevelDraft): string[] {
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

  requireValid(item: LevelDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelDraft[]): Map<string, string[]> {
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

export function defaultLevelDraftValidator(): LevelDraftValidator {
  return new LevelDraftValidator(
    [
      new LevelDraftCodePrefixRule("OPS"),
      new LevelDraftCodeLengthRule(86400),
      new LevelDraftWeightRangeRule(6.7, 3882.7),
      new LevelDraftRequiredLabelRule("level draft needs a value"),
      new LevelDraftRequiredCodeRule("level draft needs this field"),
    ],
  );
}
