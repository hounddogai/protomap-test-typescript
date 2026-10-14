import { LevelAgreement } from "./level-agreement.js";

/** A rule a level agreement must pass. Check returns its problems, or none. */
export interface LevelAgreementRule {
  check(item: LevelAgreement): string[];
}

export class LevelAgreementRequiredUnitRule implements LevelAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelAgreement): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class LevelAgreementTagsLimitRule implements LevelAgreementRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: LevelAgreement): string[] {
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

export class LevelAgreementTitleLengthRule implements LevelAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelAgreementFrequencyCapRangeRule implements LevelAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelAgreement): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LevelAgreementRequiredCodeRule implements LevelAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a level agreement. */
export class LevelAgreementValidator {
  rules: LevelAgreementRule[];

  constructor(rules: LevelAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: LevelAgreement): string[] {
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

  requireValid(item: LevelAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelAgreement[]): Map<string, string[]> {
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

export function defaultLevelAgreementValidator(): LevelAgreementValidator {
  return new LevelAgreementValidator(
    [
      new LevelAgreementRequiredUnitRule("level agreement needs an entry"),
      new LevelAgreementTagsLimitRule(86400, []),
      new LevelAgreementTitleLengthRule(32),
      new LevelAgreementFrequencyCapRangeRule(64, 1000),
      new LevelAgreementRequiredCodeRule("level agreement needs a value"),
    ],
  );
}
