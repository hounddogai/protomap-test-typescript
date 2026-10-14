import { StrictProofAdjustment } from "./strict-proof-adjustment.js";

/** A rule a strict proof adjustment must pass. Check returns its problems, or none. */
export interface StrictProofAdjustmentRule {
  check(item: StrictProofAdjustment): string[];
}

export class StrictProofAdjustmentDurationMinutesRangeRule implements StrictProofAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictProofAdjustment): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictProofAdjustmentRequiredCodeRule implements StrictProofAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictProofAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictProofAdjustmentTitleLengthRule implements StrictProofAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictProofAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictProofAdjustmentRequiredTitleRule implements StrictProofAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictProofAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictProofAdjustmentCodePrefixRule implements StrictProofAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictProofAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict proof adjustment. */
export class StrictProofAdjustmentValidator {
  rules: StrictProofAdjustmentRule[];

  constructor(rules: StrictProofAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: StrictProofAdjustment): string[] {
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

  requireValid(item: StrictProofAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictProofAdjustment[]): Map<string, string[]> {
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

export function defaultStrictProofAdjustmentValidator(): StrictProofAdjustmentValidator {
  return new StrictProofAdjustmentValidator(
    [
      new StrictProofAdjustmentDurationMinutesRangeRule(80, 1000),
      new StrictProofAdjustmentRequiredCodeRule("strict proof adjustment needs a value"),
      new StrictProofAdjustmentTitleLengthRule(32),
      new StrictProofAdjustmentRequiredTitleRule("strict proof adjustment needs an entry"),
      new StrictProofAdjustmentCodePrefixRule("Q"),
    ],
  );
}
