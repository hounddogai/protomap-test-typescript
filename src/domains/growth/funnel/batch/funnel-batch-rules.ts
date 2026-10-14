import * as text from "../../../../kit/text.js";
import { FunnelBatch } from "./funnel-batch.js";

/** A rule a funnel batch must pass. Check returns its problems, or none. */
export interface FunnelBatchRule {
  check(item: FunnelBatch): string[];
}

export class FunnelBatchAllowedOwnerIdRule implements FunnelBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is inconsistent`];
    return [];
  }
}

export class FunnelBatchStartsAtRangeRule implements FunnelBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelBatch): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FunnelBatchCodeLengthRule implements FunnelBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelBatchCodePrefixRule implements FunnelBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FunnelBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a funnel batch. */
export class FunnelBatchValidator {
  rules: FunnelBatchRule[];

  constructor(rules: FunnelBatchRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelBatch[]): Map<string, string[]> {
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

export function defaultFunnelBatchValidator(): FunnelBatchValidator {
  return new FunnelBatchValidator(
    [
      new FunnelBatchAllowedOwnerIdRule(["fallback"]),
      new FunnelBatchStartsAtRangeRule(64, 120),
      new FunnelBatchCodeLengthRule(64),
      new FunnelBatchCodePrefixRule("REF"),
    ],
  );
}
