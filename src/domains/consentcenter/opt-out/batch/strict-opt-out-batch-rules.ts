import { StrictOptOutBatch } from "./strict-opt-out-batch.js";

/** A rule a strict opt out batch must pass. Check returns its problems, or none. */
export interface StrictOptOutBatchRule {
  check(item: StrictOptOutBatch): string[];
}

export class StrictOptOutBatchCodePrefixRule implements StrictOptOutBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictOptOutBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictOptOutBatchRequiredNameRule implements StrictOptOutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictOptOutBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictOptOutBatchMarginRangeRule implements StrictOptOutBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictOptOutBatch): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictOptOutBatchContactEmailLengthRule implements StrictOptOutBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictOptOutBatch): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictOptOutBatchRequiredContactEmailRule implements StrictOptOutBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictOptOutBatch): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict opt out batch. */
export class StrictOptOutBatchValidator {
  rules: StrictOptOutBatchRule[];

  constructor(rules: StrictOptOutBatchRule[]) {
    this.rules = rules;
  }

  validate(item: StrictOptOutBatch): string[] {
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

  requireValid(item: StrictOptOutBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictOptOutBatch[]): Map<string, string[]> {
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

export function defaultStrictOptOutBatchValidator(): StrictOptOutBatchValidator {
  return new StrictOptOutBatchValidator(
    [
      new StrictOptOutBatchCodePrefixRule("OPS"),
      new StrictOptOutBatchRequiredNameRule("strict opt out batch needs an entry"),
      new StrictOptOutBatchMarginRangeRule(2.6, 4128),
      new StrictOptOutBatchContactEmailLengthRule(120),
      new StrictOptOutBatchRequiredContactEmailRule("strict opt out batch needs a value"),
    ],
  );
}
