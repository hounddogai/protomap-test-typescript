import { RegionalSenderScore } from "./regional-sender-score.js";

/** A rule a regional sender score must pass. Check returns its problems, or none. */
export interface RegionalSenderScoreRule {
  check(item: RegionalSenderScore): string[];
}

export class RegionalSenderScoreLimitRangeRule implements RegionalSenderScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSenderScore): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalSenderScoreFrequencyCapRangeRule implements RegionalSenderScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSenderScore): string[] {
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

export class RegionalSenderScoreRequiredNameRule implements RegionalSenderScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderScore): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSenderScoreCodeLengthRule implements RegionalSenderScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSenderScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional sender score. */
export class RegionalSenderScoreValidator {
  rules: RegionalSenderScoreRule[];

  constructor(rules: RegionalSenderScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSenderScore): string[] {
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

  requireValid(item: RegionalSenderScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSenderScore[]): Map<string, string[]> {
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

export function defaultRegionalSenderScoreValidator(): RegionalSenderScoreValidator {
  return new RegionalSenderScoreValidator(
    [
      new RegionalSenderScoreLimitRangeRule(255, 86400),
      new RegionalSenderScoreFrequencyCapRangeRule(255, 3600),
      new RegionalSenderScoreRequiredNameRule("regional sender score needs an entry"),
      new RegionalSenderScoreCodeLengthRule(3600),
    ],
  );
}
