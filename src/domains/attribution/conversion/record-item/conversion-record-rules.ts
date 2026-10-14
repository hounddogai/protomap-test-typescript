import * as text from "../../../../kit/text.js";
import { ConversionRecord } from "./conversion-record.js";

/** A rule a conversion record must pass. Check returns its problems, or none. */
export interface ConversionRecordRule {
  check(item: ConversionRecord): string[];
}

export class ConversionRecordRequiredCodeRule implements ConversionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionRecordRequiredTitleRule implements ConversionRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionRecordLimitRangeRule implements ConversionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionRecord): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionRecordScoreRangeRule implements ConversionRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionRecord): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ConversionRecordAllowedTitleRule implements ConversionRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

/** Runs every rule of a conversion record. */
export class ConversionRecordValidator {
  rules: ConversionRecordRule[];

  constructor(rules: ConversionRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionRecord): string[] {
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

  requireValid(item: ConversionRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionRecord[]): Map<string, string[]> {
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

export function defaultConversionRecordValidator(): ConversionRecordValidator {
  return new ConversionRecordValidator(
    [
      new ConversionRecordRequiredCodeRule("conversion record needs a value"),
      new ConversionRecordRequiredTitleRule("conversion record needs this field"),
      new ConversionRecordLimitRangeRule(120, 86400),
      new ConversionRecordScoreRangeRule(9.5, 2428.8),
      new ConversionRecordAllowedTitleRule([]),
    ],
  );
}
