import * as text from "../../../../kit/text.js";
import { RegionalReputationScore } from "./regional-reputation-score.js";

/** A rule a regional reputation score must pass. Check returns its problems, or none. */
export interface RegionalReputationScoreRule {
  check(item: RegionalReputationScore): string[];
}

export class RegionalReputationScoreCodeLengthRule implements RegionalReputationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReputationScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalReputationScoreLabelLengthRule implements RegionalReputationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReputationScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalReputationScoreAllowedTitleRule implements RegionalReputationScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalReputationScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class RegionalReputationScoreTitleLengthRule implements RegionalReputationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReputationScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalReputationScoreCodePrefixRule implements RegionalReputationScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalReputationScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalReputationScoreNameLengthRule implements RegionalReputationScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReputationScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional reputation score. */
export class RegionalReputationScoreValidator {
  rules: RegionalReputationScoreRule[];

  constructor(rules: RegionalReputationScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalReputationScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalReputationScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalReputationScore[]): Map<string, string[]> {
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

export function defaultRegionalReputationScoreValidator(): RegionalReputationScoreValidator {
  return new RegionalReputationScoreValidator(
    [
      new RegionalReputationScoreCodeLengthRule(32),
      new RegionalReputationScoreLabelLengthRule(1000),
      new RegionalReputationScoreAllowedTitleRule(["regional"]),
      new RegionalReputationScoreTitleLengthRule(16),
      new RegionalReputationScoreCodePrefixRule("X"),
      new RegionalReputationScoreNameLengthRule(1000),
    ],
  );
}
