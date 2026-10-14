import { WindowEstimate } from "./window-estimate.js";

/** A rule a window estimate must pass. Check returns its problems, or none. */
export interface WindowEstimateRule {
  check(item: WindowEstimate): string[];
}

export class WindowEstimateLabelLengthRule implements WindowEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowEstimateRequiredReviewerRule implements WindowEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowEstimate): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class WindowEstimateCodePrefixRule implements WindowEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowEstimateActiveGuardRule implements WindowEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WindowEstimate): string[] {
    if (item.active && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while active`];
    return [];
  }
}

export class WindowEstimateNameLengthRule implements WindowEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a window estimate. */
export class WindowEstimateValidator {
  rules: WindowEstimateRule[];

  constructor(rules: WindowEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: WindowEstimate): string[] {
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

  requireValid(item: WindowEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowEstimate[]): Map<string, string[]> {
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

export function defaultWindowEstimateValidator(): WindowEstimateValidator {
  return new WindowEstimateValidator(
    [
      new WindowEstimateLabelLengthRule(80),
      new WindowEstimateRequiredReviewerRule("window estimate needs this field"),
      new WindowEstimateCodePrefixRule("Q"),
      new WindowEstimateActiveGuardRule(16),
      new WindowEstimateNameLengthRule(1000),
    ],
  );
}
