import { QueueBundle } from "./queue-bundle.js";

/** A rule a queue bundle must pass. Check returns its problems, or none. */
export interface QueueBundleRule {
  check(item: QueueBundle): string[];
}

export class QueueBundleRequiredSummaryRule implements QueueBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueBundle): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class QueueBundleScoreRangeRule implements QueueBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueBundle): string[] {
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

export class QueueBundleEndsAtRangeRule implements QueueBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueBundle): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a queue bundle. */
export class QueueBundleValidator {
  rules: QueueBundleRule[];

  constructor(rules: QueueBundleRule[]) {
    this.rules = rules;
  }

  validate(item: QueueBundle): string[] {
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

  requireValid(item: QueueBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueBundle[]): Map<string, string[]> {
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

export function defaultQueueBundleValidator(): QueueBundleValidator {
  return new QueueBundleValidator(
    [
      new QueueBundleRequiredSummaryRule("queue bundle needs a value"),
      new QueueBundleScoreRangeRule(3.9, 2795.9),
      new QueueBundleEndsAtRangeRule(255, 86400),
    ],
  );
}
