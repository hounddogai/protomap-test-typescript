import * as text from "../../../../kit/text.js";
import { TicketViewBatch } from "./ticket-view-batch.js";

/** A rule a ticket view batch must pass. Check returns its problems, or none. */
export interface TicketViewBatchRule {
  check(item: TicketViewBatch): string[];
}

export class TicketViewBatchAllowedCodeRule implements TicketViewBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TicketViewBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class TicketViewBatchSegmentLengthRule implements TicketViewBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewBatch): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewBatchBatchSizeRangeRule implements TicketViewBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewBatch): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewBatchTitleLengthRule implements TicketViewBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewBatch): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewBatchRequiredTitleRule implements TicketViewBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewBatch): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewBatchCodePrefixRule implements TicketViewBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a ticket view batch. */
export class TicketViewBatchValidator {
  rules: TicketViewBatchRule[];

  constructor(rules: TicketViewBatchRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewBatch): string[] {
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

  requireValid(item: TicketViewBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewBatch[]): Map<string, string[]> {
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

export function defaultTicketViewBatchValidator(): TicketViewBatchValidator {
  return new TicketViewBatchValidator(
    [
      new TicketViewBatchAllowedCodeRule(["lenient"]),
      new TicketViewBatchSegmentLengthRule(3600),
      new TicketViewBatchBatchSizeRangeRule(80, 86400),
      new TicketViewBatchTitleLengthRule(16),
      new TicketViewBatchRequiredTitleRule("ticket view batch needs an entry"),
      new TicketViewBatchCodePrefixRule("X"),
    ],
  );
}
