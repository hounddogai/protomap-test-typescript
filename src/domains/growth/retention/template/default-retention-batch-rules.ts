import { DefaultRetentionBatch } from "./default-retention-batch.js";

/** A rule a default retention batch must pass. Check returns its problems, or none. */
export interface DefaultRetentionBatchRule {
  check(item: DefaultRetentionBatch): string[];
}

export class DefaultRetentionBatchRequiredLabelRule implements DefaultRetentionBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRetentionBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultRetentionBatchCodePrefixRule implements DefaultRetentionBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultRetentionBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultRetentionBatchClicksRangeRule implements DefaultRetentionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRetentionBatch): string[] {
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

export class DefaultRetentionBatchAttemptsRangeRule implements DefaultRetentionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRetentionBatch): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultRetentionBatchEndsAtRangeRule implements DefaultRetentionBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultRetentionBatch): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default retention batch. */
export class DefaultRetentionBatchValidator {
  rules: DefaultRetentionBatchRule[];

  constructor(rules: DefaultRetentionBatchRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultRetentionBatch): string[] {
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

  requireValid(item: DefaultRetentionBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultRetentionBatch[]): Map<string, string[]> {
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

export function defaultDefaultRetentionBatchValidator(): DefaultRetentionBatchValidator {
  return new DefaultRetentionBatchValidator(
    [
      new DefaultRetentionBatchRequiredLabelRule("default retention batch needs a value"),
      new DefaultRetentionBatchCodePrefixRule("X"),
      new DefaultRetentionBatchClicksRangeRule(32, 3600),
      new DefaultRetentionBatchAttemptsRangeRule(32, 86400),
      new DefaultRetentionBatchEndsAtRangeRule(80, 1000),
    ],
  );
}
