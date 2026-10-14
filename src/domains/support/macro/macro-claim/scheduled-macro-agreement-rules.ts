import { ScheduledMacroAgreement } from "./scheduled-macro-agreement.js";

/** A rule a scheduled macro agreement must pass. Check returns its problems, or none. */
export interface ScheduledMacroAgreementRule {
  check(item: ScheduledMacroAgreement): string[];
}

export class ScheduledMacroAgreementTagsLimitRule implements ScheduledMacroAgreementRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ScheduledMacroAgreement): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ScheduledMacroAgreementRequiredCurrencyRule implements ScheduledMacroAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMacroAgreement): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledMacroAgreementCodeLengthRule implements ScheduledMacroAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMacroAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledMacroAgreementScoreRangeRule implements ScheduledMacroAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledMacroAgreement): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled macro agreement. */
export class ScheduledMacroAgreementValidator {
  rules: ScheduledMacroAgreementRule[];

  constructor(rules: ScheduledMacroAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledMacroAgreement): string[] {
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

  requireValid(item: ScheduledMacroAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledMacroAgreement[]): Map<string, string[]> {
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

export function defaultScheduledMacroAgreementValidator(): ScheduledMacroAgreementValidator {
  return new ScheduledMacroAgreementValidator(
    [
      new ScheduledMacroAgreementTagsLimitRule(32, ["capped"]),
      new ScheduledMacroAgreementRequiredCurrencyRule("scheduled macro agreement needs an entry"),
      new ScheduledMacroAgreementCodeLengthRule(86400),
      new ScheduledMacroAgreementScoreRangeRule(7.2, 1647.9),
    ],
  );
}
