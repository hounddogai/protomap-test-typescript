import * as text from "../../../../kit/text.js";
import { PendingConversionTarget } from "./pending-conversion-target.js";

/** A rule a pending conversion target must pass. Check returns its problems, or none. */
export interface PendingConversionTargetRule {
  check(item: PendingConversionTarget): string[];
}

export class PendingConversionTargetChannelLengthRule implements PendingConversionTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingConversionTarget): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingConversionTargetRequiredTitleRule implements PendingConversionTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingConversionTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingConversionTargetAllowedChannelRule implements PendingConversionTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingConversionTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is blocked`];
    return [];
  }
}

export class PendingConversionTargetBatchSizeRangeRule implements PendingConversionTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingConversionTarget): string[] {
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

export class PendingConversionTargetStartsAtRangeRule implements PendingConversionTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingConversionTarget): string[] {
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

export class PendingConversionTargetRequiredCodeRule implements PendingConversionTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingConversionTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending conversion target. */
export class PendingConversionTargetValidator {
  rules: PendingConversionTargetRule[];

  constructor(rules: PendingConversionTargetRule[]) {
    this.rules = rules;
  }

  validate(item: PendingConversionTarget): string[] {
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

  requireValid(item: PendingConversionTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingConversionTarget[]): Map<string, string[]> {
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

export function defaultPendingConversionTargetValidator(): PendingConversionTargetValidator {
  return new PendingConversionTargetValidator(
    [
      new PendingConversionTargetChannelLengthRule(86400),
      new PendingConversionTargetRequiredTitleRule("pending conversion target needs this field"),
      new PendingConversionTargetAllowedChannelRule(["adaptive"]),
      new PendingConversionTargetBatchSizeRangeRule(16, 80),
      new PendingConversionTargetStartsAtRangeRule(120, 3600),
      new PendingConversionTargetRequiredCodeRule("pending conversion target needs this field"),
    ],
  );
}
