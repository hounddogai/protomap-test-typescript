import * as text from "../../../../kit/text.js";
import { LegacyDomainBatch } from "./legacy-domain-batch.js";

/** A rule a legacy domain batch must pass. Check returns its problems, or none. */
export interface LegacyDomainBatchRule {
  check(item: LegacyDomainBatch): string[];
}

export class LegacyDomainBatchRatioRangeRule implements LegacyDomainBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDomainBatch): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyDomainBatchRequiredNameRule implements LegacyDomainBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDomainBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDomainBatchNameLengthRule implements LegacyDomainBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDomainBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDomainBatchAllowedNameRule implements LegacyDomainBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyDomainBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class LegacyDomainBatchCodeLengthRule implements LegacyDomainBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyDomainBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyDomainBatchRequiredSummaryRule implements LegacyDomainBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDomainBatch): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy domain batch. */
export class LegacyDomainBatchValidator {
  rules: LegacyDomainBatchRule[];

  constructor(rules: LegacyDomainBatchRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDomainBatch): string[] {
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

  requireValid(item: LegacyDomainBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDomainBatch[]): Map<string, string[]> {
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

export function defaultLegacyDomainBatchValidator(): LegacyDomainBatchValidator {
  return new LegacyDomainBatchValidator(
    [
      new LegacyDomainBatchRatioRangeRule(6.1, 3365.3),
      new LegacyDomainBatchRequiredNameRule("legacy domain batch needs an entry"),
      new LegacyDomainBatchNameLengthRule(3600),
      new LegacyDomainBatchAllowedNameRule(["lenient", "seasonal"]),
      new LegacyDomainBatchCodeLengthRule(16),
      new LegacyDomainBatchRequiredSummaryRule("legacy domain batch needs this field"),
    ],
  );
}
