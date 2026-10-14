import * as text from "../../../../kit/text.js";
import { DefaultChallengeThreshold } from "./default-challenge-threshold.js";

/** A rule a default challenge threshold must pass. Check returns its problems, or none. */
export interface DefaultChallengeThresholdRule {
  check(item: DefaultChallengeThreshold): string[];
}

export class DefaultChallengeThresholdJourneyIdLengthRule implements DefaultChallengeThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultChallengeThreshold): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultChallengeThresholdAllowedTitleRule implements DefaultChallengeThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultChallengeThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class DefaultChallengeThresholdCodePrefixRule implements DefaultChallengeThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultChallengeThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultChallengeThresholdCodeLengthRule implements DefaultChallengeThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultChallengeThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default challenge threshold. */
export class DefaultChallengeThresholdValidator {
  rules: DefaultChallengeThresholdRule[];

  constructor(rules: DefaultChallengeThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultChallengeThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultChallengeThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultChallengeThreshold[]): Map<string, string[]> {
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

export function defaultDefaultChallengeThresholdValidator(): DefaultChallengeThresholdValidator {
  return new DefaultChallengeThresholdValidator(
    [
      new DefaultChallengeThresholdJourneyIdLengthRule(80),
      new DefaultChallengeThresholdAllowedTitleRule([]),
      new DefaultChallengeThresholdCodePrefixRule("REF"),
      new DefaultChallengeThresholdCodeLengthRule(32),
    ],
  );
}
