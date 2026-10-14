import * as text from "../../../../kit/text.js";
import { WeightedMentionProfile } from "./weighted-mention-profile.js";

/** A rule a weighted mention profile must pass. Check returns its problems, or none. */
export interface WeightedMentionProfileRule {
  check(item: WeightedMentionProfile): string[];
}

export class WeightedMentionProfileJourneyIdLengthRule implements WeightedMentionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedMentionProfile): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedMentionProfileAllowedNotesRule implements WeightedMentionProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedMentionProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is inconsistent`];
    return [];
  }
}

export class WeightedMentionProfileCodeLengthRule implements WeightedMentionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedMentionProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedMentionProfileRequiredJourneyIdRule implements WeightedMentionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedMentionProfile): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedMentionProfileNotesLengthRule implements WeightedMentionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedMentionProfile): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted mention profile. */
export class WeightedMentionProfileValidator {
  rules: WeightedMentionProfileRule[];

  constructor(rules: WeightedMentionProfileRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedMentionProfile): string[] {
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

  requireValid(item: WeightedMentionProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedMentionProfile[]): Map<string, string[]> {
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

export function defaultWeightedMentionProfileValidator(): WeightedMentionProfileValidator {
  return new WeightedMentionProfileValidator(
    [
      new WeightedMentionProfileJourneyIdLengthRule(120),
      new WeightedMentionProfileAllowedNotesRule(["rolling", "global", "manual"]),
      new WeightedMentionProfileCodeLengthRule(16),
      new WeightedMentionProfileRequiredJourneyIdRule("weighted mention profile needs an entry"),
      new WeightedMentionProfileNotesLengthRule(255),
    ],
  );
}
