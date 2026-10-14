import { ChallengeRule } from "./challenge-rule.js";

/** A rule a challenge rule must pass. Check returns its problems, or none. */
export interface ChallengeRuleRule {
  check(item: ChallengeRule): string[];
}

export class ChallengeRuleRequiredLabelRule implements ChallengeRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeRule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeRuleRequiredLocaleRule implements ChallengeRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeRule): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeRuleTagsLimitRule implements ChallengeRuleRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ChallengeRule): string[] {
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

export class ChallengeRuleBatchSizeRangeRule implements ChallengeRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ChallengeRule): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a challenge rule. */
export class ChallengeRuleValidator {
  rules: ChallengeRuleRule[];

  constructor(rules: ChallengeRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ChallengeRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeRule[]): Map<string, string[]> {
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

export function defaultChallengeRuleValidator(): ChallengeRuleValidator {
  return new ChallengeRuleValidator(
    [
      new ChallengeRuleRequiredLabelRule("challenge rule needs this field"),
      new ChallengeRuleRequiredLocaleRule("challenge rule needs a value"),
      new ChallengeRuleTagsLimitRule(86400, ["fallback", "adaptive", "weighted"]),
      new ChallengeRuleBatchSizeRangeRule(120, 255),
    ],
  );
}
