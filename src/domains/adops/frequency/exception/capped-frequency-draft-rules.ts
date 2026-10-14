import { CappedFrequencyDraft } from "./capped-frequency-draft.js";

/** A rule a capped frequency draft must pass. Check returns its problems, or none. */
export interface CappedFrequencyDraftRule {
  check(item: CappedFrequencyDraft): string[];
}

export class CappedFrequencyDraftRequiredChannelRule implements CappedFrequencyDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyDraft): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFrequencyDraftRequiredCodeRule implements CappedFrequencyDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFrequencyDraftVersionRangeRule implements CappedFrequencyDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFrequencyDraft): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedFrequencyDraftStartsAtRangeRule implements CappedFrequencyDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFrequencyDraft): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedFrequencyDraftChannelLengthRule implements CappedFrequencyDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFrequencyDraft): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFrequencyDraftRequiredTitleRule implements CappedFrequencyDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFrequencyDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped frequency draft. */
export class CappedFrequencyDraftValidator {
  rules: CappedFrequencyDraftRule[];

  constructor(rules: CappedFrequencyDraftRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFrequencyDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedFrequencyDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFrequencyDraft[]): Map<string, string[]> {
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

export function defaultCappedFrequencyDraftValidator(): CappedFrequencyDraftValidator {
  return new CappedFrequencyDraftValidator(
    [
      new CappedFrequencyDraftRequiredChannelRule("capped frequency draft needs an entry"),
      new CappedFrequencyDraftRequiredCodeRule("capped frequency draft needs a value"),
      new CappedFrequencyDraftVersionRangeRule(255, 86400),
      new CappedFrequencyDraftStartsAtRangeRule(64, 3600),
      new CappedFrequencyDraftChannelLengthRule(255),
      new CappedFrequencyDraftRequiredTitleRule("capped frequency draft needs an entry"),
    ],
  );
}
