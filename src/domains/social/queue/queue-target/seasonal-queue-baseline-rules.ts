import * as text from "../../../../kit/text.js";
import { SeasonalQueueBaseline } from "./seasonal-queue-baseline.js";

/** A rule a seasonal queue baseline must pass. Check returns its problems, or none. */
export interface SeasonalQueueBaselineRule {
  check(item: SeasonalQueueBaseline): string[];
}

export class SeasonalQueueBaselineRequiredExternalRefRule implements SeasonalQueueBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalQueueBaseline): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalQueueBaselineRequiredLabelRule implements SeasonalQueueBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalQueueBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalQueueBaselineTagsLimitRule implements SeasonalQueueBaselineRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: SeasonalQueueBaseline): string[] {
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

export class SeasonalQueueBaselineAllowedLabelRule implements SeasonalQueueBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalQueueBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a seasonal queue baseline. */
export class SeasonalQueueBaselineValidator {
  rules: SeasonalQueueBaselineRule[];

  constructor(rules: SeasonalQueueBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalQueueBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalQueueBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalQueueBaseline[]): Map<string, string[]> {
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

export function defaultSeasonalQueueBaselineValidator(): SeasonalQueueBaselineValidator {
  return new SeasonalQueueBaselineValidator(
    [
      new SeasonalQueueBaselineRequiredExternalRefRule("seasonal queue baseline needs this field"),
      new SeasonalQueueBaselineRequiredLabelRule("seasonal queue baseline needs an entry"),
      new SeasonalQueueBaselineTagsLimitRule(32, ["regional"]),
      new SeasonalQueueBaselineAllowedLabelRule(["tiered"]),
    ],
  );
}
