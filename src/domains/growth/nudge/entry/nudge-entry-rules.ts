import { NudgeEntry } from "./nudge-entry.js";

/** A rule a nudge entry must pass. Check returns its problems, or none. */
export interface NudgeEntryRule {
  check(item: NudgeEntry): string[];
}

export class NudgeEntryRequiredTitleRule implements NudgeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeEntryCodePrefixRule implements NudgeEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeEntryRequiredSegmentRule implements NudgeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeEntry): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeEntryCodeLengthRule implements NudgeEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a nudge entry. */
export class NudgeEntryValidator {
  rules: NudgeEntryRule[];

  constructor(rules: NudgeEntryRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeEntry[]): Map<string, string[]> {
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

export function defaultNudgeEntryValidator(): NudgeEntryValidator {
  return new NudgeEntryValidator(
    [
      new NudgeEntryRequiredTitleRule("nudge entry needs this field"),
      new NudgeEntryCodePrefixRule("ACM"),
      new NudgeEntryRequiredSegmentRule("nudge entry needs a value"),
      new NudgeEntryCodeLengthRule(32),
    ],
  );
}
