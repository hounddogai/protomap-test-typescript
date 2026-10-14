import { ChallengeEntry } from "./challenge-entry.js";

/** A rule a challenge entry must pass. Check returns its problems, or none. */
export interface ChallengeEntryRule {
  check(item: ChallengeEntry): string[];
}

export class ChallengeEntryRequiredTitleRule implements ChallengeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeEntryRequiredCodeRule implements ChallengeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeEntryCodePrefixRule implements ChallengeEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ChallengeEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ChallengeEntryTagsLimitRule implements ChallengeEntryRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ChallengeEntry): string[] {
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

export class ChallengeEntryWeightRangeRule implements ChallengeEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeEntry): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a challenge entry. */
export class ChallengeEntryValidator {
  rules: ChallengeEntryRule[];

  constructor(rules: ChallengeEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeEntry): string[] {
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

  requireValid(item: ChallengeEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeEntry[]): Map<string, string[]> {
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

export function defaultChallengeEntryValidator(): ChallengeEntryValidator {
  return new ChallengeEntryValidator(
    [
      new ChallengeEntryRequiredTitleRule("challenge entry needs an entry"),
      new ChallengeEntryRequiredCodeRule("challenge entry needs a value"),
      new ChallengeEntryCodePrefixRule("Q"),
      new ChallengeEntryTagsLimitRule(32, ["tiered"]),
      new ChallengeEntryWeightRangeRule(6.7, 3582.1),
    ],
  );
}
