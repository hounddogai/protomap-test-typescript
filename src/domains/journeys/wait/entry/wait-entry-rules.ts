import { WaitEntry } from "./wait-entry.js";

/** A rule a wait entry must pass. Check returns its problems, or none. */
export interface WaitEntryRule {
  check(item: WaitEntry): string[];
}

export class WaitEntryTitleLengthRule implements WaitEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitEntryRequiredTitleRule implements WaitEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WaitEntryRequiredCodeRule implements WaitEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitEntryRateRangeRule implements WaitEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitEntry): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitEntryCodeLengthRule implements WaitEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait entry. */
export class WaitEntryValidator {
  rules: WaitEntryRule[];

  constructor(rules: WaitEntryRule[]) {
    this.rules = rules;
  }

  validate(item: WaitEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitEntry[]): Map<string, string[]> {
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

export function defaultWaitEntryValidator(): WaitEntryValidator {
  return new WaitEntryValidator(
    [
      new WaitEntryTitleLengthRule(1000),
      new WaitEntryRequiredTitleRule("wait entry needs a value"),
      new WaitEntryRequiredCodeRule("wait entry needs a value"),
      new WaitEntryRateRangeRule(4.2, 3798.2),
      new WaitEntryCodeLengthRule(32),
    ],
  );
}
