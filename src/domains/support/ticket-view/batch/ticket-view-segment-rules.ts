import * as text from "../../../../kit/text.js";
import { TicketViewSegment } from "./ticket-view-segment.js";

/** A rule a ticket view segment must pass. Check returns its problems, or none. */
export interface TicketViewSegmentRule {
  check(item: TicketViewSegment): string[];
}

export class TicketViewSegmentCodePrefixRule implements TicketViewSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewSegmentCostRangeRule implements TicketViewSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewSegment): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewSegmentAllowedSummaryRule implements TicketViewSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TicketViewSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is below minimum`];
    return [];
  }
}

export class TicketViewSegmentCodeLengthRule implements TicketViewSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a ticket view segment. */
export class TicketViewSegmentValidator {
  rules: TicketViewSegmentRule[];

  constructor(rules: TicketViewSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewSegment[]): Map<string, string[]> {
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

export function defaultTicketViewSegmentValidator(): TicketViewSegmentValidator {
  return new TicketViewSegmentValidator(
    [
      new TicketViewSegmentCodePrefixRule("REF"),
      new TicketViewSegmentCostRangeRule(9.8, 2407.1),
      new TicketViewSegmentAllowedSummaryRule(["regional", "weighted"]),
      new TicketViewSegmentCodeLengthRule(1000),
    ],
  );
}
