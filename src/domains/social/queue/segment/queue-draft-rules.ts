import { QueueDraft } from "./queue-draft.js";

/** A rule a queue draft must pass. Check returns its problems, or none. */
export interface QueueDraftRule {
  check(item: QueueDraft): string[];
}

export class QueueDraftCodeLengthRule implements QueueDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueDraftClicksRangeRule implements QueueDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueDraft): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueDraftCampaignRefLengthRule implements QueueDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueDraft): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a queue draft. */
export class QueueDraftValidator {
  rules: QueueDraftRule[];

  constructor(rules: QueueDraftRule[]) {
    this.rules = rules;
  }

  validate(item: QueueDraft): string[] {
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

  requireValid(item: QueueDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueDraft[]): Map<string, string[]> {
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

export function defaultQueueDraftValidator(): QueueDraftValidator {
  return new QueueDraftValidator(
    [
      new QueueDraftCodeLengthRule(32),
      new QueueDraftClicksRangeRule(16, 1000),
      new QueueDraftCampaignRefLengthRule(32),
    ],
  );
}
