import * as text from "../../../../kit/text.js";
import { FrequencyEntry } from "./frequency-entry.js";

/** A rule a frequency entry must pass. Check returns its problems, or none. */
export interface FrequencyEntryRule {
  check(item: FrequencyEntry): string[];
}

export class FrequencyEntryRequiredReviewerRule implements FrequencyEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyEntry): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyEntryAllowedCohortRule implements FrequencyEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is not allowed`];
    return [];
  }
}

export class FrequencyEntryCodePrefixRule implements FrequencyEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a frequency entry. */
export class FrequencyEntryValidator {
  rules: FrequencyEntryRule[];

  constructor(rules: FrequencyEntryRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyEntry[]): Map<string, string[]> {
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

export function defaultFrequencyEntryValidator(): FrequencyEntryValidator {
  return new FrequencyEntryValidator(
    [
      new FrequencyEntryRequiredReviewerRule("frequency entry needs this field"),
      new FrequencyEntryAllowedCohortRule(["strict", "pending", "scheduled"]),
      new FrequencyEntryCodePrefixRule("X"),
    ],
  );
}
