import { AdaptiveCohortScore } from "./adaptive-cohort-score.js";

/** A rule a adaptive cohort score must pass. Check returns its problems, or none. */
export interface AdaptiveCohortScoreRule {
  check(item: AdaptiveCohortScore): string[];
}

export class AdaptiveCohortScoreRequiredAudienceIdRule implements AdaptiveCohortScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCohortScore): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCohortScoreClicksRangeRule implements AdaptiveCohortScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCohortScore): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveCohortScoreRequiredCodeRule implements AdaptiveCohortScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCohortScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCohortScoreArchivedGuardRule implements AdaptiveCohortScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveCohortScore): string[] {
    if (item.archived && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class AdaptiveCohortScoreUtmSourceLengthRule implements AdaptiveCohortScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCohortScore): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive cohort score. */
export class AdaptiveCohortScoreValidator {
  rules: AdaptiveCohortScoreRule[];

  constructor(rules: AdaptiveCohortScoreRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCohortScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveCohortScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCohortScore[]): Map<string, string[]> {
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

export function defaultAdaptiveCohortScoreValidator(): AdaptiveCohortScoreValidator {
  return new AdaptiveCohortScoreValidator(
    [
      new AdaptiveCohortScoreRequiredAudienceIdRule("adaptive cohort score needs a value"),
      new AdaptiveCohortScoreClicksRangeRule(255, 86400),
      new AdaptiveCohortScoreRequiredCodeRule("adaptive cohort score needs an entry"),
      new AdaptiveCohortScoreArchivedGuardRule(64),
      new AdaptiveCohortScoreUtmSourceLengthRule(64),
    ],
  );
}
