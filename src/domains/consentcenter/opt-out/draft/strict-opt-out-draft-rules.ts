import { StrictOptOutDraft } from "./strict-opt-out-draft.js";

/** A rule a strict opt out draft must pass. Check returns its problems, or none. */
export interface StrictOptOutDraftRule {
  check(item: StrictOptOutDraft): string[];
}

export class StrictOptOutDraftTitleLengthRule implements StrictOptOutDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictOptOutDraft): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictOptOutDraftChannelLengthRule implements StrictOptOutDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictOptOutDraft): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictOptOutDraftUpdatedAtRangeRule implements StrictOptOutDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictOptOutDraft): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictOptOutDraftRequiredCodeRule implements StrictOptOutDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictOptOutDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictOptOutDraftCategoryLengthRule implements StrictOptOutDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictOptOutDraft): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict opt out draft. */
export class StrictOptOutDraftValidator {
  rules: StrictOptOutDraftRule[];

  constructor(rules: StrictOptOutDraftRule[]) {
    this.rules = rules;
  }

  validate(item: StrictOptOutDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictOptOutDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictOptOutDraft[]): Map<string, string[]> {
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

export function defaultStrictOptOutDraftValidator(): StrictOptOutDraftValidator {
  return new StrictOptOutDraftValidator(
    [
      new StrictOptOutDraftTitleLengthRule(32),
      new StrictOptOutDraftChannelLengthRule(255),
      new StrictOptOutDraftUpdatedAtRangeRule(32, 120),
      new StrictOptOutDraftRequiredCodeRule("strict opt out draft needs a value"),
      new StrictOptOutDraftCategoryLengthRule(255),
    ],
  );
}
