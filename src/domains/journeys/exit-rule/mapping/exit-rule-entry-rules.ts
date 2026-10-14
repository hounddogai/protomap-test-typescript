import { ExitRuleEntry } from "./exit-rule-entry.js";

/** A rule a exit rule entry must pass. Check returns its problems, or none. */
export interface ExitRuleEntryRule {
  check(item: ExitRuleEntry): string[];
}

export class ExitRuleEntryMaximumRangeRule implements ExitRuleEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleEntry): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleEntryRequiredRegionRule implements ExitRuleEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleEntry): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleEntryChannelLengthRule implements ExitRuleEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleEntry): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a exit rule entry. */
export class ExitRuleEntryValidator {
  rules: ExitRuleEntryRule[];

  constructor(rules: ExitRuleEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ExitRuleEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleEntry[]): Map<string, string[]> {
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

export function defaultExitRuleEntryValidator(): ExitRuleEntryValidator {
  return new ExitRuleEntryValidator(
    [
      new ExitRuleEntryMaximumRangeRule(9.2, 2999.7),
      new ExitRuleEntryRequiredRegionRule("exit rule entry needs this field"),
      new ExitRuleEntryChannelLengthRule(255),
    ],
  );
}
