import * as text from "../../../../kit/text.js";
import { LenientQueueDraft } from "./lenient-queue-draft.js";

/** A rule a lenient queue draft must pass. Check returns its problems, or none. */
export interface LenientQueueDraftRule {
  check(item: LenientQueueDraft): string[];
}

export class LenientQueueDraftLabelLengthRule implements LenientQueueDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientQueueDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientQueueDraftRequiredCodeRule implements LenientQueueDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientQueueDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientQueueDraftAllowedUtmSourceRule implements LenientQueueDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientQueueDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is unknown`];
    return [];
  }
}

export class LenientQueueDraftRequiredCategoryRule implements LenientQueueDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientQueueDraft): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient queue draft. */
export class LenientQueueDraftValidator {
  rules: LenientQueueDraftRule[];

  constructor(rules: LenientQueueDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LenientQueueDraft): string[] {
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

  requireValid(item: LenientQueueDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientQueueDraft[]): Map<string, string[]> {
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

export function defaultLenientQueueDraftValidator(): LenientQueueDraftValidator {
  return new LenientQueueDraftValidator(
    [
      new LenientQueueDraftLabelLengthRule(80),
      new LenientQueueDraftRequiredCodeRule("lenient queue draft needs this field"),
      new LenientQueueDraftAllowedUtmSourceRule(["manual", "fallback"]),
      new LenientQueueDraftRequiredCategoryRule("lenient queue draft needs a value"),
    ],
  );
}
