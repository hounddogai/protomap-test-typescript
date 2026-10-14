import { BranchScore } from "./branch-score.js";

/** A rule a branch score must pass. Check returns its problems, or none. */
export interface BranchScoreRule {
  check(item: BranchScore): string[];
}

export class BranchScoreRequiredChannelRule implements BranchScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchScore): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BranchScoreJourneyIdLengthRule implements BranchScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchScore): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchScoreCodePrefixRule implements BranchScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BranchScoreRequiredCodeRule implements BranchScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchScoreImpressionsRangeRule implements BranchScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchScore): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a branch score. */
export class BranchScoreValidator {
  rules: BranchScoreRule[];

  constructor(rules: BranchScoreRule[]) {
    this.rules = rules;
  }

  validate(item: BranchScore): string[] {
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

  requireValid(item: BranchScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchScore[]): Map<string, string[]> {
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

export function defaultBranchScoreValidator(): BranchScoreValidator {
  return new BranchScoreValidator(
    [
      new BranchScoreRequiredChannelRule("branch score needs an entry"),
      new BranchScoreJourneyIdLengthRule(64),
      new BranchScoreCodePrefixRule("OPS"),
      new BranchScoreRequiredCodeRule("branch score needs this field"),
      new BranchScoreImpressionsRangeRule(32, 255),
    ],
  );
}
