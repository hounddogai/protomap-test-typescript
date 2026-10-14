import { DefaultPathDraft } from "./default-path-draft.js";

/** A rule a default path draft must pass. Check returns its problems, or none. */
export interface DefaultPathDraftRule {
  check(item: DefaultPathDraft): string[];
}

export class DefaultPathDraftChannelLengthRule implements DefaultPathDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPathDraft): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPathDraftWindowDaysRangeRule implements DefaultPathDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPathDraft): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultPathDraftRequiredLocaleRule implements DefaultPathDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPathDraft): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPathDraftRequiredChannelRule implements DefaultPathDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPathDraft): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPathDraftAttemptsRangeRule implements DefaultPathDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPathDraft): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultPathDraftRateRangeRule implements DefaultPathDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPathDraft): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default path draft. */
export class DefaultPathDraftValidator {
  rules: DefaultPathDraftRule[];

  constructor(rules: DefaultPathDraftRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPathDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPathDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPathDraft[]): Map<string, string[]> {
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

export function defaultDefaultPathDraftValidator(): DefaultPathDraftValidator {
  return new DefaultPathDraftValidator(
    [
      new DefaultPathDraftChannelLengthRule(32),
      new DefaultPathDraftWindowDaysRangeRule(16, 86400),
      new DefaultPathDraftRequiredLocaleRule("default path draft needs an entry"),
      new DefaultPathDraftRequiredChannelRule("default path draft needs a value"),
      new DefaultPathDraftAttemptsRangeRule(16, 120),
      new DefaultPathDraftRateRangeRule(8.8, 719.7),
    ],
  );
}
