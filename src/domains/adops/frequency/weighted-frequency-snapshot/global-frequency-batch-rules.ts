import { GlobalFrequencyBatch } from "./global-frequency-batch.js";

/** A rule a global frequency batch must pass. Check returns its problems, or none. */
export interface GlobalFrequencyBatchRule {
  check(item: GlobalFrequencyBatch): string[];
}

export class GlobalFrequencyBatchCodeLengthRule implements GlobalFrequencyBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFrequencyBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFrequencyBatchRequiredNameRule implements GlobalFrequencyBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFrequencyBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFrequencyBatchUtmSourceLengthRule implements GlobalFrequencyBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFrequencyBatch): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFrequencyBatchRequiredUtmSourceRule implements GlobalFrequencyBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFrequencyBatch): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFrequencyBatchCodePrefixRule implements GlobalFrequencyBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalFrequencyBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global frequency batch. */
export class GlobalFrequencyBatchValidator {
  rules: GlobalFrequencyBatchRule[];

  constructor(rules: GlobalFrequencyBatchRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFrequencyBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalFrequencyBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFrequencyBatch[]): Map<string, string[]> {
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

export function defaultGlobalFrequencyBatchValidator(): GlobalFrequencyBatchValidator {
  return new GlobalFrequencyBatchValidator(
    [
      new GlobalFrequencyBatchCodeLengthRule(16),
      new GlobalFrequencyBatchRequiredNameRule("global frequency batch needs an entry"),
      new GlobalFrequencyBatchUtmSourceLengthRule(16),
      new GlobalFrequencyBatchRequiredUtmSourceRule("global frequency batch needs this field"),
      new GlobalFrequencyBatchCodePrefixRule("OPS"),
    ],
  );
}
