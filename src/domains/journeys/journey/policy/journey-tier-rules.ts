import { JourneyTier } from "./journey-tier.js";

/** A rule a journey tier must pass. Check returns its problems, or none. */
export interface JourneyTierRule {
  check(item: JourneyTier): string[];
}

export class JourneyTierRequiredCodeRule implements JourneyTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyTierCodeLengthRule implements JourneyTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyTierTagsLimitRule implements JourneyTierRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: JourneyTier): string[] {
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

/** Runs every rule of a journey tier. */
export class JourneyTierValidator {
  rules: JourneyTierRule[];

  constructor(rules: JourneyTierRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyTier[]): Map<string, string[]> {
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

export function defaultJourneyTierValidator(): JourneyTierValidator {
  return new JourneyTierValidator(
    [
      new JourneyTierRequiredCodeRule("journey tier needs an entry"),
      new JourneyTierCodeLengthRule(3600),
      new JourneyTierTagsLimitRule(255, ["batched", "scheduled", "lenient"]),
    ],
  );
}
