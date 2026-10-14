import { FallbackQueueRule } from "./fallback-queue-rule.js";

/** A rule a fallback queue rule must pass. Check returns its problems, or none. */
export interface FallbackQueueRuleRule {
  check(item: FallbackQueueRule): string[];
}

export class FallbackQueueRuleScoreRangeRule implements FallbackQueueRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackQueueRule): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackQueueRuleArchivedGuardRule implements FallbackQueueRuleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackQueueRule): string[] {
    if (item.archived && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class FallbackQueueRuleRequiredChecksumRule implements FallbackQueueRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackQueueRule): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback queue rule. */
export class FallbackQueueRuleValidator {
  rules: FallbackQueueRuleRule[];

  constructor(rules: FallbackQueueRuleRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackQueueRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackQueueRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackQueueRule[]): Map<string, string[]> {
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

export function defaultFallbackQueueRuleValidator(): FallbackQueueRuleValidator {
  return new FallbackQueueRuleValidator(
    [
      new FallbackQueueRuleScoreRangeRule(9.4, 4431.8),
      new FallbackQueueRuleArchivedGuardRule(7.4),
      new FallbackQueueRuleRequiredChecksumRule("fallback queue rule needs this field"),
    ],
  );
}
