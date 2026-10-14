import { WeightedTierRecord } from "./weighted-tier-record.js";

/** A rule a weighted tier record must pass. Check returns its problems, or none. */
export interface WeightedTierRecordRule {
  check(item: WeightedTierRecord): string[];
}

export class WeightedTierRecordCodeLengthRule implements WeightedTierRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTierRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTierRecordRequiredPhoneRule implements WeightedTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTierRecord): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTierRecordRequiredNotesRule implements WeightedTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTierRecord): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTierRecordRequiredNameRule implements WeightedTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTierRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTierRecordCodePrefixRule implements WeightedTierRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedTierRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a weighted tier record. */
export class WeightedTierRecordValidator {
  rules: WeightedTierRecordRule[];

  constructor(rules: WeightedTierRecordRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedTierRecord): string[] {
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

  requireValid(item: WeightedTierRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedTierRecord[]): Map<string, string[]> {
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

export function defaultWeightedTierRecordValidator(): WeightedTierRecordValidator {
  return new WeightedTierRecordValidator(
    [
      new WeightedTierRecordCodeLengthRule(1000),
      new WeightedTierRecordRequiredPhoneRule("weighted tier record needs a value"),
      new WeightedTierRecordRequiredNotesRule("weighted tier record needs an entry"),
      new WeightedTierRecordRequiredNameRule("weighted tier record needs a value"),
      new WeightedTierRecordCodePrefixRule("Q"),
    ],
  );
}
