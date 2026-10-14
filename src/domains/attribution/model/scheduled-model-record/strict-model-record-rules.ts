import { StrictModelRecord } from "./strict-model-record.js";

/** A rule a strict model record must pass. Check returns its problems, or none. */
export interface StrictModelRecordRule {
  check(item: StrictModelRecord): string[];
}

export class StrictModelRecordRequiredNameRule implements StrictModelRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictModelRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictModelRecordPhoneLengthRule implements StrictModelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictModelRecord): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictModelRecordCodeLengthRule implements StrictModelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictModelRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictModelRecordClicksRangeRule implements StrictModelRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictModelRecord): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictModelRecordQuantityRangeRule implements StrictModelRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictModelRecord): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictModelRecordRequiredCodeRule implements StrictModelRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictModelRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict model record. */
export class StrictModelRecordValidator {
  rules: StrictModelRecordRule[];

  constructor(rules: StrictModelRecordRule[]) {
    this.rules = rules;
  }

  validate(item: StrictModelRecord): string[] {
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

  requireValid(item: StrictModelRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictModelRecord[]): Map<string, string[]> {
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

export function defaultStrictModelRecordValidator(): StrictModelRecordValidator {
  return new StrictModelRecordValidator(
    [
      new StrictModelRecordRequiredNameRule("strict model record needs a value"),
      new StrictModelRecordPhoneLengthRule(32),
      new StrictModelRecordCodeLengthRule(255),
      new StrictModelRecordClicksRangeRule(80, 3600),
      new StrictModelRecordQuantityRangeRule(32, 120),
      new StrictModelRecordRequiredCodeRule("strict model record needs a value"),
    ],
  );
}
