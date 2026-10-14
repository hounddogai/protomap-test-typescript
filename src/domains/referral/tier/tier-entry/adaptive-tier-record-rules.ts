import { AdaptiveTierRecord } from "./adaptive-tier-record.js";

/** A rule a adaptive tier record must pass. Check returns its problems, or none. */
export interface AdaptiveTierRecordRule {
  check(item: AdaptiveTierRecord): string[];
}

export class AdaptiveTierRecordRequiredContactEmailRule implements AdaptiveTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTierRecord): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveTierRecordRequiredTitleRule implements AdaptiveTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTierRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveTierRecordCodePrefixRule implements AdaptiveTierRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveTierRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveTierRecordUpdatedAtRangeRule implements AdaptiveTierRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveTierRecord): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveTierRecordRequiredCodeRule implements AdaptiveTierRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTierRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive tier record. */
export class AdaptiveTierRecordValidator {
  rules: AdaptiveTierRecordRule[];

  constructor(rules: AdaptiveTierRecordRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveTierRecord): string[] {
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

  requireValid(item: AdaptiveTierRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveTierRecord[]): Map<string, string[]> {
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

export function defaultAdaptiveTierRecordValidator(): AdaptiveTierRecordValidator {
  return new AdaptiveTierRecordValidator(
    [
      new AdaptiveTierRecordRequiredContactEmailRule("adaptive tier record needs an entry"),
      new AdaptiveTierRecordRequiredTitleRule("adaptive tier record needs a value"),
      new AdaptiveTierRecordCodePrefixRule("OPS"),
      new AdaptiveTierRecordUpdatedAtRangeRule(64, 3600),
      new AdaptiveTierRecordRequiredCodeRule("adaptive tier record needs a value"),
    ],
  );
}
