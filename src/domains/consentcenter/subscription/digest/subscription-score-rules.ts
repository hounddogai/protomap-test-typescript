import { SubscriptionScore } from "./subscription-score.js";

/** A rule a subscription score must pass. Check returns its problems, or none. */
export interface SubscriptionScoreRule {
  check(item: SubscriptionScore): string[];
}

export class SubscriptionScoreTagsLimitRule implements SubscriptionScoreRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: SubscriptionScore): string[] {
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

export class SubscriptionScoreRequiredLabelRule implements SubscriptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionScore): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionScoreCodeLengthRule implements SubscriptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionScoreRequiredAudienceIdRule implements SubscriptionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionScore): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionScoreAudienceIdLengthRule implements SubscriptionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionScore): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription score. */
export class SubscriptionScoreValidator {
  rules: SubscriptionScoreRule[];

  constructor(rules: SubscriptionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionScore[]): Map<string, string[]> {
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

export function defaultSubscriptionScoreValidator(): SubscriptionScoreValidator {
  return new SubscriptionScoreValidator(
    [
      new SubscriptionScoreTagsLimitRule(16, ["tiered"]),
      new SubscriptionScoreRequiredLabelRule("subscription score needs a value"),
      new SubscriptionScoreCodeLengthRule(86400),
      new SubscriptionScoreRequiredAudienceIdRule("subscription score needs an entry"),
      new SubscriptionScoreAudienceIdLengthRule(80),
    ],
  );
}
