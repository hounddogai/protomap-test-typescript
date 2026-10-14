import * as text from "../../../../kit/text.js";
import { QueueAgreement } from "./queue-agreement.js";

/** A rule a queue agreement must pass. Check returns its problems, or none. */
export interface QueueAgreementRule {
  check(item: QueueAgreement): string[];
}

export class QueueAgreementRequiredLabelRule implements QueueAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class QueueAgreementRetriesRangeRule implements QueueAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueAgreement): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueAgreementDiscountRangeRule implements QueueAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: QueueAgreement): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class QueueAgreementAllowedCodeRule implements QueueAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: QueueAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class QueueAgreementRequiredCodeRule implements QueueAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: QueueAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a queue agreement. */
export class QueueAgreementValidator {
  rules: QueueAgreementRule[];

  constructor(rules: QueueAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: QueueAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: QueueAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: QueueAgreement[]): Map<string, string[]> {
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

export function defaultQueueAgreementValidator(): QueueAgreementValidator {
  return new QueueAgreementValidator(
    [
      new QueueAgreementRequiredLabelRule("queue agreement needs this field"),
      new QueueAgreementRetriesRangeRule(16, 255),
      new QueueAgreementDiscountRangeRule(0.9, 1840.5),
      new QueueAgreementAllowedCodeRule([]),
      new QueueAgreementRequiredCodeRule("queue agreement needs a value"),
    ],
  );
}
