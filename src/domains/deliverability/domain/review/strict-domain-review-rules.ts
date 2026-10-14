import { StrictDomainReview } from "./strict-domain-review.js";

/** A rule a strict domain review must pass. Check returns its problems, or none. */
export interface StrictDomainReviewRule {
  check(item: StrictDomainReview): string[];
}

export class StrictDomainReviewRequiredNameRule implements StrictDomainReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictDomainReview): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictDomainReviewScoreRangeRule implements StrictDomainReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictDomainReview): string[] {
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

export class StrictDomainReviewCodePrefixRule implements StrictDomainReviewRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictDomainReview): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictDomainReviewTagsLimitRule implements StrictDomainReviewRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: StrictDomainReview): string[] {
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

export class StrictDomainReviewNameLengthRule implements StrictDomainReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictDomainReview): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictDomainReviewRequiredCampaignRefRule implements StrictDomainReviewRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictDomainReview): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict domain review. */
export class StrictDomainReviewValidator {
  rules: StrictDomainReviewRule[];

  constructor(rules: StrictDomainReviewRule[]) {
    this.rules = rules;
  }

  validate(item: StrictDomainReview): string[] {
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

  requireValid(item: StrictDomainReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictDomainReview[]): Map<string, string[]> {
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

export function defaultStrictDomainReviewValidator(): StrictDomainReviewValidator {
  return new StrictDomainReviewValidator(
    [
      new StrictDomainReviewRequiredNameRule("strict domain review needs a value"),
      new StrictDomainReviewScoreRangeRule(5.7, 3492.4),
      new StrictDomainReviewCodePrefixRule("OPS"),
      new StrictDomainReviewTagsLimitRule(1000, ["fallback", "pending", "global"]),
      new StrictDomainReviewNameLengthRule(86400),
      new StrictDomainReviewRequiredCampaignRefRule("strict domain review needs an entry"),
    ],
  );
}
