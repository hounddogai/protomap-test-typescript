import { DefaultComplaintBatch } from "./default-complaint-batch.js";

/** A rule a default complaint batch must pass. Check returns its problems, or none. */
export interface DefaultComplaintBatchRule {
  check(item: DefaultComplaintBatch): string[];
}

export class DefaultComplaintBatchDescriptionLengthRule implements DefaultComplaintBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultComplaintBatch): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultComplaintBatchCodePrefixRule implements DefaultComplaintBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultComplaintBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultComplaintBatchSequenceRangeRule implements DefaultComplaintBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultComplaintBatch): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultComplaintBatchRequiredLocaleRule implements DefaultComplaintBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultComplaintBatch): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultComplaintBatchRequiredCodeRule implements DefaultComplaintBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultComplaintBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default complaint batch. */
export class DefaultComplaintBatchValidator {
  rules: DefaultComplaintBatchRule[];

  constructor(rules: DefaultComplaintBatchRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultComplaintBatch): string[] {
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

  requireValid(item: DefaultComplaintBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultComplaintBatch[]): Map<string, string[]> {
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

export function defaultDefaultComplaintBatchValidator(): DefaultComplaintBatchValidator {
  return new DefaultComplaintBatchValidator(
    [
      new DefaultComplaintBatchDescriptionLengthRule(32),
      new DefaultComplaintBatchCodePrefixRule("ACM"),
      new DefaultComplaintBatchSequenceRangeRule(16, 32),
      new DefaultComplaintBatchRequiredLocaleRule("default complaint batch needs a value"),
      new DefaultComplaintBatchRequiredCodeRule("default complaint batch needs this field"),
    ],
  );
}
