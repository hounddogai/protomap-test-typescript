import * as text from "../../../../kit/text.js";
import { RegionalSenderBatch } from "./regional-sender-batch.js";

/** A rule a regional sender batch must pass. Check returns its problems, or none. */
export interface RegionalSenderBatchRule {
  check(item: RegionalSenderBatch): string[];
}

export class RegionalSenderBatchCodeLengthRule implements RegionalSenderBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSenderBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSenderBatchRequiredLabelRule implements RegionalSenderBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSenderBatchLimitRangeRule implements RegionalSenderBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSenderBatch): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSenderBatchRequiredJourneyIdRule implements RegionalSenderBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderBatch): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSenderBatchAllowedJourneyIdRule implements RegionalSenderBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalSenderBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is out of range`];
    return [];
  }
}

/** Runs every rule of a regional sender batch. */
export class RegionalSenderBatchValidator {
  rules: RegionalSenderBatchRule[];

  constructor(rules: RegionalSenderBatchRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSenderBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalSenderBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSenderBatch[]): Map<string, string[]> {
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

export function defaultRegionalSenderBatchValidator(): RegionalSenderBatchValidator {
  return new RegionalSenderBatchValidator(
    [
      new RegionalSenderBatchCodeLengthRule(3600),
      new RegionalSenderBatchRequiredLabelRule("regional sender batch needs a value"),
      new RegionalSenderBatchLimitRangeRule(64, 80),
      new RegionalSenderBatchRequiredJourneyIdRule("regional sender batch needs this field"),
      new RegionalSenderBatchAllowedJourneyIdRule(["weighted"]),
    ],
  );
}
