import { CreditDraft } from "./credit-draft.js";

/** A rule a credit draft must pass. Check returns its problems, or none. */
export interface CreditDraftRule {
  check(item: CreditDraft): string[];
}

export class CreditDraftScoreRangeRule implements CreditDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditDraft): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditDraftRequiredCodeRule implements CreditDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreditDraftCodePrefixRule implements CreditDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a credit draft. */
export class CreditDraftValidator {
  rules: CreditDraftRule[];

  constructor(rules: CreditDraftRule[]) {
    this.rules = rules;
  }

  validate(item: CreditDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditDraft[]): Map<string, string[]> {
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

export function defaultCreditDraftValidator(): CreditDraftValidator {
  return new CreditDraftValidator(
    [
      new CreditDraftScoreRangeRule(3.8, 781.4),
      new CreditDraftRequiredCodeRule("credit draft needs a value"),
      new CreditDraftCodePrefixRule("X"),
    ],
  );
}
