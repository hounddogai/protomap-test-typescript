import * as text from "../../../../kit/text.js";
import { AdaptiveChallengeBatch } from "./adaptive-challenge-batch.js";

/** A rule a adaptive challenge batch must pass. Check returns its problems, or none. */
export interface AdaptiveChallengeBatchRule {
  check(item: AdaptiveChallengeBatch): string[];
}

export class AdaptiveChallengeBatchLabelLengthRule implements AdaptiveChallengeBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveChallengeBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveChallengeBatchAllowedCodeRule implements AdaptiveChallengeBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveChallengeBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class AdaptiveChallengeBatchRequiredCodeRule implements AdaptiveChallengeBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveChallengeBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive challenge batch. */
export class AdaptiveChallengeBatchValidator {
  rules: AdaptiveChallengeBatchRule[];

  constructor(rules: AdaptiveChallengeBatchRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveChallengeBatch): string[] {
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

  requireValid(item: AdaptiveChallengeBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveChallengeBatch[]): Map<string, string[]> {
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

export function defaultAdaptiveChallengeBatchValidator(): AdaptiveChallengeBatchValidator {
  return new AdaptiveChallengeBatchValidator(
    [
      new AdaptiveChallengeBatchLabelLengthRule(86400),
      new AdaptiveChallengeBatchAllowedCodeRule(["pending", "seasonal"]),
      new AdaptiveChallengeBatchRequiredCodeRule("adaptive challenge batch needs this field"),
    ],
  );
}
