import { GlobalRetentionWindow } from "./global-retention-window.js";

/** A rule a global retention window must pass. Check returns its problems, or none. */
export interface GlobalRetentionWindowRule {
  check(item: GlobalRetentionWindow): string[];
}

export class GlobalRetentionWindowRequiredLabelRule implements GlobalRetentionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRetentionWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRetentionWindowChecksumLengthRule implements GlobalRetentionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRetentionWindow): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRetentionWindowAttemptsRangeRule implements GlobalRetentionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRetentionWindow): string[] {
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

/** Runs every rule of a global retention window. */
export class GlobalRetentionWindowValidator {
  rules: GlobalRetentionWindowRule[];

  constructor(rules: GlobalRetentionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRetentionWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRetentionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRetentionWindow[]): Map<string, string[]> {
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

export function defaultGlobalRetentionWindowValidator(): GlobalRetentionWindowValidator {
  return new GlobalRetentionWindowValidator(
    [
      new GlobalRetentionWindowRequiredLabelRule("global retention window needs a value"),
      new GlobalRetentionWindowChecksumLengthRule(255),
      new GlobalRetentionWindowAttemptsRangeRule(32, 3600),
    ],
  );
}
