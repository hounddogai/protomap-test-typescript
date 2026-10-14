import { TieredActivationWindow } from "./tiered-activation-window.js";

/** A rule a tiered activation window must pass. Check returns its problems, or none. */
export interface TieredActivationWindowRule {
  check(item: TieredActivationWindow): string[];
}

export class TieredActivationWindowRequiredCodeRule implements TieredActivationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationWindowRequiredTitleRule implements TieredActivationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredActivationWindowCodeLengthRule implements TieredActivationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredActivationWindowRequiredLocaleRule implements TieredActivationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredActivationWindow): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered activation window. */
export class TieredActivationWindowValidator {
  rules: TieredActivationWindowRule[];

  constructor(rules: TieredActivationWindowRule[]) {
    this.rules = rules;
  }

  validate(item: TieredActivationWindow): string[] {
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

  requireValid(item: TieredActivationWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredActivationWindow[]): Map<string, string[]> {
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

export function defaultTieredActivationWindowValidator(): TieredActivationWindowValidator {
  return new TieredActivationWindowValidator(
    [
      new TieredActivationWindowRequiredCodeRule("tiered activation window needs a value"),
      new TieredActivationWindowRequiredTitleRule("tiered activation window needs an entry"),
      new TieredActivationWindowCodeLengthRule(86400),
      new TieredActivationWindowRequiredLocaleRule("tiered activation window needs an entry"),
    ],
  );
}
