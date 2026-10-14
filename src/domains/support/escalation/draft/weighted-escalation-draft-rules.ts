import { WeightedEscalationDraft } from "./weighted-escalation-draft.js";

/** A rule a weighted escalation draft must pass. Check returns its problems, or none. */
export interface WeightedEscalationDraftRule {
  check(item: WeightedEscalationDraft): string[];
}

export class WeightedEscalationDraftRequiredTitleRule implements WeightedEscalationDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedEscalationDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedEscalationDraftChannelLengthRule implements WeightedEscalationDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedEscalationDraft): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedEscalationDraftRetriesRangeRule implements WeightedEscalationDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedEscalationDraft): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted escalation draft. */
export class WeightedEscalationDraftValidator {
  rules: WeightedEscalationDraftRule[];

  constructor(rules: WeightedEscalationDraftRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedEscalationDraft): string[] {
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

  requireValid(item: WeightedEscalationDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedEscalationDraft[]): Map<string, string[]> {
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

export function defaultWeightedEscalationDraftValidator(): WeightedEscalationDraftValidator {
  return new WeightedEscalationDraftValidator(
    [
      new WeightedEscalationDraftRequiredTitleRule("weighted escalation draft needs an entry"),
      new WeightedEscalationDraftChannelLengthRule(32),
      new WeightedEscalationDraftRetriesRangeRule(64, 120),
    ],
  );
}
