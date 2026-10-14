import { BatchedCreditOverride } from "./batched-credit-override.js";

/** A rule a batched credit override must pass. Check returns its problems, or none. */
export interface BatchedCreditOverrideRule {
  check(item: BatchedCreditOverride): string[];
}

export class BatchedCreditOverrideRequiredSegmentRule implements BatchedCreditOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCreditOverride): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCreditOverrideRequiredLabelRule implements BatchedCreditOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCreditOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCreditOverrideRequiredUtmSourceRule implements BatchedCreditOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedCreditOverride): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedCreditOverrideCodePrefixRule implements BatchedCreditOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedCreditOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedCreditOverrideSegmentLengthRule implements BatchedCreditOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedCreditOverride): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched credit override. */
export class BatchedCreditOverrideValidator {
  rules: BatchedCreditOverrideRule[];

  constructor(rules: BatchedCreditOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedCreditOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedCreditOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedCreditOverride[]): Map<string, string[]> {
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

export function defaultBatchedCreditOverrideValidator(): BatchedCreditOverrideValidator {
  return new BatchedCreditOverrideValidator(
    [
      new BatchedCreditOverrideRequiredSegmentRule("batched credit override needs an entry"),
      new BatchedCreditOverrideRequiredLabelRule("batched credit override needs this field"),
      new BatchedCreditOverrideRequiredUtmSourceRule("batched credit override needs this field"),
      new BatchedCreditOverrideCodePrefixRule("Q"),
      new BatchedCreditOverrideSegmentLengthRule(1000),
    ],
  );
}
