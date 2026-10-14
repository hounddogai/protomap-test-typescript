import { ChallengeOverride } from "./challenge-override.js";

/** A rule a challenge override must pass. Check returns its problems, or none. */
export interface ChallengeOverrideRule {
  check(item: ChallengeOverride): string[];
}

export class ChallengeOverrideRequiredContactEmailRule implements ChallengeOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeOverride): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeOverrideCodePrefixRule implements ChallengeOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeOverrideRatioRangeRule implements ChallengeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeOverride): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ChallengeOverrideCodeLengthRule implements ChallengeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a challenge override. */
export class ChallengeOverrideValidator {
  rules: ChallengeOverrideRule[];

  constructor(rules: ChallengeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeOverride): string[] {
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

  requireValid(item: ChallengeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeOverride[]): Map<string, string[]> {
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

export function defaultChallengeOverrideValidator(): ChallengeOverrideValidator {
  return new ChallengeOverrideValidator(
    [
      new ChallengeOverrideRequiredContactEmailRule("challenge override needs an entry"),
      new ChallengeOverrideCodePrefixRule("X"),
      new ChallengeOverrideRatioRangeRule(4.8, 2176.2),
      new ChallengeOverrideCodeLengthRule(32),
    ],
  );
}
