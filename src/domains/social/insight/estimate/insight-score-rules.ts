import { InsightScore } from "./insight-score.js";

/** A rule a insight score must pass. Check returns its problems, or none. */
export interface InsightScoreRule {
  check(item: InsightScore): string[];
}

export class InsightScoreRequiredUnitRule implements InsightScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightScore): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class InsightScoreRequiredTitleRule implements InsightScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InsightScoreRequiredRegionRule implements InsightScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightScore): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class InsightScoreRegionLengthRule implements InsightScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightScore): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightScoreOpenRateRangeRule implements InsightScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightScore): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightScoreCeilingRangeRule implements InsightScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightScore): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a insight score. */
export class InsightScoreValidator {
  rules: InsightScoreRule[];

  constructor(rules: InsightScoreRule[]) {
    this.rules = rules;
  }

  validate(item: InsightScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightScore[]): Map<string, string[]> {
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

export function defaultInsightScoreValidator(): InsightScoreValidator {
  return new InsightScoreValidator(
    [
      new InsightScoreRequiredUnitRule("insight score needs a value"),
      new InsightScoreRequiredTitleRule("insight score needs this field"),
      new InsightScoreRequiredRegionRule("insight score needs this field"),
      new InsightScoreRegionLengthRule(80),
      new InsightScoreOpenRateRangeRule(3.2, 3624.6),
      new InsightScoreCeilingRangeRule(5.8, 4203.8),
    ],
  );
}
