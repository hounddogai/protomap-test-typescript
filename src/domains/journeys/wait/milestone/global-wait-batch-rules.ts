import { GlobalWaitBatch } from "./global-wait-batch.js";

/** A rule a global wait batch must pass. Check returns its problems, or none. */
export interface GlobalWaitBatchRule {
  check(item: GlobalWaitBatch): string[];
}

export class GlobalWaitBatchDiscountRangeRule implements GlobalWaitBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalWaitBatch): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalWaitBatchTagsLimitRule implements GlobalWaitBatchRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: GlobalWaitBatch): string[] {
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

export class GlobalWaitBatchRequiredJourneyIdRule implements GlobalWaitBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalWaitBatch): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global wait batch. */
export class GlobalWaitBatchValidator {
  rules: GlobalWaitBatchRule[];

  constructor(rules: GlobalWaitBatchRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalWaitBatch): string[] {
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

  requireValid(item: GlobalWaitBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalWaitBatch[]): Map<string, string[]> {
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

export function defaultGlobalWaitBatchValidator(): GlobalWaitBatchValidator {
  return new GlobalWaitBatchValidator(
    [
      new GlobalWaitBatchDiscountRangeRule(7.3, 1886.4),
      new GlobalWaitBatchTagsLimitRule(1000, ["seasonal"]),
      new GlobalWaitBatchRequiredJourneyIdRule("global wait batch needs an entry"),
    ],
  );
}
