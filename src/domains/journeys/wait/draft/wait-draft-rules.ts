import { WaitDraft } from "./wait-draft.js";

/** A rule a wait draft must pass. Check returns its problems, or none. */
export interface WaitDraftRule {
  check(item: WaitDraft): string[];
}

export class WaitDraftBatchSizeRangeRule implements WaitDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitDraft): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitDraftRequiredTitleRule implements WaitDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WaitDraftRequiredCodeRule implements WaitDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitDraftJourneyIdLengthRule implements WaitDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitDraft): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait draft. */
export class WaitDraftValidator {
  rules: WaitDraftRule[];

  constructor(rules: WaitDraftRule[]) {
    this.rules = rules;
  }

  validate(item: WaitDraft): string[] {
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

  requireValid(item: WaitDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitDraft[]): Map<string, string[]> {
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

export function defaultWaitDraftValidator(): WaitDraftValidator {
  return new WaitDraftValidator(
    [
      new WaitDraftBatchSizeRangeRule(16, 120),
      new WaitDraftRequiredTitleRule("wait draft needs this field"),
      new WaitDraftRequiredCodeRule("wait draft needs a value"),
      new WaitDraftJourneyIdLengthRule(32),
    ],
  );
}
