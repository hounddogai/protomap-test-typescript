import { CreativeRecord } from "./creative-record.js";

/** A rule a creative record must pass. Check returns its problems, or none. */
export interface CreativeRecordRule {
  check(item: CreativeRecord): string[];
}

export class CreativeRecordCodePrefixRule implements CreativeRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeRecordRequiredNameRule implements CreativeRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeRecordAttemptsRangeRule implements CreativeRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeRecord): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeRecordPhoneLengthRule implements CreativeRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeRecord): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeRecordBatchSizeRangeRule implements CreativeRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeRecord): string[] {
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

/** Runs every rule of a creative record. */
export class CreativeRecordValidator {
  rules: CreativeRecordRule[];

  constructor(rules: CreativeRecordRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeRecord): string[] {
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

  requireValid(item: CreativeRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeRecord[]): Map<string, string[]> {
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

export function defaultCreativeRecordValidator(): CreativeRecordValidator {
  return new CreativeRecordValidator(
    [
      new CreativeRecordCodePrefixRule("X"),
      new CreativeRecordRequiredNameRule("creative record needs a value"),
      new CreativeRecordAttemptsRangeRule(32, 86400),
      new CreativeRecordPhoneLengthRule(255),
      new CreativeRecordBatchSizeRangeRule(80, 1000),
    ],
  );
}
