import { EscalationEntry } from "./escalation-entry.js";

/** A rule a escalation entry must pass. Check returns its problems, or none. */
export interface EscalationEntryRule {
  check(item: EscalationEntry): string[];
}

export class EscalationEntryRequiredCodeRule implements EscalationEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationEntryCodeLengthRule implements EscalationEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationEntryRequiredTitleRule implements EscalationEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a escalation entry. */
export class EscalationEntryValidator {
  rules: EscalationEntryRule[];

  constructor(rules: EscalationEntryRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationEntry): string[] {
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

  requireValid(item: EscalationEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationEntry[]): Map<string, string[]> {
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

export function defaultEscalationEntryValidator(): EscalationEntryValidator {
  return new EscalationEntryValidator(
    [
      new EscalationEntryRequiredCodeRule("escalation entry needs a value"),
      new EscalationEntryCodeLengthRule(1000),
      new EscalationEntryRequiredTitleRule("escalation entry needs an entry"),
    ],
  );
}
