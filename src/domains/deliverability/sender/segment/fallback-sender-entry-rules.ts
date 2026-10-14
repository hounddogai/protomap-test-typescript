import { FallbackSenderEntry } from "./fallback-sender-entry.js";

/** A rule a fallback sender entry must pass. Check returns its problems, or none. */
export interface FallbackSenderEntryRule {
  check(item: FallbackSenderEntry): string[];
}

export class FallbackSenderEntryRequiredLabelRule implements FallbackSenderEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSenderEntry): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSenderEntryRequiredCodeRule implements FallbackSenderEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSenderEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackSenderEntryRateRangeRule implements FallbackSenderEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSenderEntry): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback sender entry. */
export class FallbackSenderEntryValidator {
  rules: FallbackSenderEntryRule[];

  constructor(rules: FallbackSenderEntryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSenderEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackSenderEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSenderEntry[]): Map<string, string[]> {
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

export function defaultFallbackSenderEntryValidator(): FallbackSenderEntryValidator {
  return new FallbackSenderEntryValidator(
    [
      new FallbackSenderEntryRequiredLabelRule("fallback sender entry needs this field"),
      new FallbackSenderEntryRequiredCodeRule("fallback sender entry needs a value"),
      new FallbackSenderEntryRateRangeRule(1.6, 3548.2),
    ],
  );
}
