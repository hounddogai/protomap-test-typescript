import { SenderDraft } from "./sender-draft.js";

/** A rule a sender draft must pass. Check returns its problems, or none. */
export interface SenderDraftRule {
  check(item: SenderDraft): string[];
}

export class SenderDraftRequiredLabelRule implements SenderDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SenderDraftCodePrefixRule implements SenderDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SenderDraftDurationMinutesRangeRule implements SenderDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderDraft): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SenderDraftMarginRangeRule implements SenderDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SenderDraft): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a sender draft. */
export class SenderDraftValidator {
  rules: SenderDraftRule[];

  constructor(rules: SenderDraftRule[]) {
    this.rules = rules;
  }

  validate(item: SenderDraft): string[] {
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

  requireValid(item: SenderDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderDraft[]): Map<string, string[]> {
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

export function defaultSenderDraftValidator(): SenderDraftValidator {
  return new SenderDraftValidator(
    [
      new SenderDraftRequiredLabelRule("sender draft needs this field"),
      new SenderDraftCodePrefixRule("Q"),
      new SenderDraftDurationMinutesRangeRule(255, 3600),
      new SenderDraftMarginRangeRule(1.3, 349.4),
    ],
  );
}
