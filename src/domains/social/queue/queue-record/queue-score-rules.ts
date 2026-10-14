import { QueueScore } from "./queue-score.js";

/** A rule a queue score must pass. Check returns its problems, or none. */
export interface QueueScoreRule {
  check(item: QueueScore): string[];
}

export class QueueScoreCodeLengthRule implements QueueScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueScoreRequiredLocaleRule implements QueueScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueScore): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class QueueScoreRequiredCodeRule implements QueueScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueScore): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a queue score. */
export class QueueScoreValidator {
  rules: QueueScoreRule[];

  constructor(rules: QueueScoreRule[]) {
    this.rules = rules;
  }

  validate(item: QueueScore): string[] {
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

  requireValid(item: QueueScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueScore[]): Map<string, string[]> {
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

export function defaultQueueScoreValidator(): QueueScoreValidator {
  return new QueueScoreValidator(
    [
      new QueueScoreCodeLengthRule(80),
      new QueueScoreRequiredLocaleRule("queue score needs an entry"),
      new QueueScoreRequiredCodeRule("queue score needs an entry"),
    ],
  );
}
