import { SeasonalPostDraft } from "./seasonal-post-draft.js";

/** A rule a seasonal post draft must pass. Check returns its problems, or none. */
export interface SeasonalPostDraftRule {
  check(item: SeasonalPostDraft): string[];
}

export class SeasonalPostDraftRequiredChannelRule implements SeasonalPostDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPostDraft): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPostDraftCodePrefixRule implements SeasonalPostDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalPostDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalPostDraftTitleLengthRule implements SeasonalPostDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPostDraft): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalPostDraftRequiredTitleRule implements SeasonalPostDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPostDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPostDraftBudgetRangeRule implements SeasonalPostDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalPostDraft): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a seasonal post draft. */
export class SeasonalPostDraftValidator {
  rules: SeasonalPostDraftRule[];

  constructor(rules: SeasonalPostDraftRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPostDraft): string[] {
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

  requireValid(item: SeasonalPostDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPostDraft[]): Map<string, string[]> {
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

export function defaultSeasonalPostDraftValidator(): SeasonalPostDraftValidator {
  return new SeasonalPostDraftValidator(
    [
      new SeasonalPostDraftRequiredChannelRule("seasonal post draft needs an entry"),
      new SeasonalPostDraftCodePrefixRule("X"),
      new SeasonalPostDraftTitleLengthRule(1000),
      new SeasonalPostDraftRequiredTitleRule("seasonal post draft needs a value"),
      new SeasonalPostDraftBudgetRangeRule(3.9, 766.4),
    ],
  );
}
