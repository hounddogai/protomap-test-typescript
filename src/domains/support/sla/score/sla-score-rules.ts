import { SlaScore } from "./sla-score.js";

/** A rule a sla score must pass. Check returns its problems, or none. */
export interface SlaScoreRule {
  check(item: SlaScore): string[];
}

export class SlaScoreVisibleGuardRule implements SlaScoreRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SlaScore): string[] {
    if (item.visible && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class SlaScoreSequenceRangeRule implements SlaScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaScore): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SlaScoreRequiredTitleRule implements SlaScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaScore): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SlaScoreCodePrefixRule implements SlaScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaScoreRequiredCodeRule implements SlaScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sla score. */
export class SlaScoreValidator {
  rules: SlaScoreRule[];

  constructor(rules: SlaScoreRule[]) {
    this.rules = rules;
  }

  validate(item: SlaScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaScore[]): Map<string, string[]> {
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

export function defaultSlaScoreValidator(): SlaScoreValidator {
  return new SlaScoreValidator(
    [
      new SlaScoreVisibleGuardRule(86400),
      new SlaScoreSequenceRangeRule(32, 120),
      new SlaScoreRequiredTitleRule("sla score needs this field"),
      new SlaScoreCodePrefixRule("ACM"),
      new SlaScoreRequiredCodeRule("sla score needs an entry"),
    ],
  );
}
