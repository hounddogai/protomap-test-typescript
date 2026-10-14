import { QueueRule } from "./queue-rule.js";

/** A rule a queue rule must pass. Check returns its problems, or none. */
export interface QueueRuleRule {
  check(item: QueueRule): string[];
}

export class QueueRuleTitleLengthRule implements QueueRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueRule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueRuleRetriesRangeRule implements QueueRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueRule): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class QueueRuleCodeLengthRule implements QueueRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: QueueRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class QueueRuleRequiredTitleRule implements QueueRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class QueueRuleRequiredSourceRule implements QueueRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueRule): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class QueueRuleCodePrefixRule implements QueueRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: QueueRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a queue rule. */
export class QueueRuleValidator {
  rules: QueueRuleRule[];

  constructor(rules: QueueRuleRule[]) {
    this.rules = rules;
  }

  validate(item: QueueRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueRule[]): Map<string, string[]> {
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

export function defaultQueueRuleValidator(): QueueRuleValidator {
  return new QueueRuleValidator(
    [
      new QueueRuleTitleLengthRule(1000),
      new QueueRuleRetriesRangeRule(16, 80),
      new QueueRuleCodeLengthRule(32),
      new QueueRuleRequiredTitleRule("queue rule needs an entry"),
      new QueueRuleRequiredSourceRule("queue rule needs a value"),
      new QueueRuleCodePrefixRule("OPS"),
    ],
  );
}
