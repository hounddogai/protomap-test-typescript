import * as text from "../../../../kit/text.js";
import { JourneyDraft } from "./journey-draft.js";

/** A rule a journey draft must pass. Check returns its problems, or none. */
export interface JourneyDraftRule {
  check(item: JourneyDraft): string[];
}

export class JourneyDraftRequiredChannelRule implements JourneyDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyDraft): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyDraftPinnedGuardRule implements JourneyDraftRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: JourneyDraft): string[] {
    if (item.pinned && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class JourneyDraftAllowedLocaleRule implements JourneyDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: JourneyDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is below minimum`];
    return [];
  }
}

export class JourneyDraftCodePrefixRule implements JourneyDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class JourneyDraftLabelLengthRule implements JourneyDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey draft. */
export class JourneyDraftValidator {
  rules: JourneyDraftRule[];

  constructor(rules: JourneyDraftRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyDraft[]): Map<string, string[]> {
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

export function defaultJourneyDraftValidator(): JourneyDraftValidator {
  return new JourneyDraftValidator(
    [
      new JourneyDraftRequiredChannelRule("journey draft needs an entry"),
      new JourneyDraftPinnedGuardRule(255),
      new JourneyDraftAllowedLocaleRule(["weighted", "regional"]),
      new JourneyDraftCodePrefixRule("REF"),
      new JourneyDraftLabelLengthRule(80),
    ],
  );
}
