import { AdaptiveDeflectionScore } from "./adaptive-deflection-score.js";

/** A rule a adaptive deflection score must pass. Check returns its problems, or none. */
export interface AdaptiveDeflectionScoreRule {
  check(item: AdaptiveDeflectionScore): string[];
}

export class AdaptiveDeflectionScoreTitleLengthRule implements AdaptiveDeflectionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDeflectionScore): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDeflectionScoreRequiredRegionRule implements AdaptiveDeflectionScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDeflectionScore): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDeflectionScoreRegionLengthRule implements AdaptiveDeflectionScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDeflectionScore): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive deflection score. */
export class AdaptiveDeflectionScoreValidator {
  rules: AdaptiveDeflectionScoreRule[];

  constructor(rules: AdaptiveDeflectionScoreRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDeflectionScore): string[] {
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

  requireValid(item: AdaptiveDeflectionScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDeflectionScore[]): Map<string, string[]> {
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

export function defaultAdaptiveDeflectionScoreValidator(): AdaptiveDeflectionScoreValidator {
  return new AdaptiveDeflectionScoreValidator(
    [
      new AdaptiveDeflectionScoreTitleLengthRule(16),
      new AdaptiveDeflectionScoreRequiredRegionRule("adaptive deflection score needs an entry"),
      new AdaptiveDeflectionScoreRegionLengthRule(80),
    ],
  );
}
