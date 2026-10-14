import { StrictQueueVariance } from "./strict-queue-variance.js";

/** A rule a strict queue variance must pass. Check returns its problems, or none. */
export interface StrictQueueVarianceRule {
  check(item: StrictQueueVariance): string[];
}

export class StrictQueueVarianceCodeLengthRule implements StrictQueueVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictQueueVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictQueueVarianceRequiredTitleRule implements StrictQueueVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictQueueVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictQueueVarianceCodePrefixRule implements StrictQueueVarianceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictQueueVariance): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict queue variance. */
export class StrictQueueVarianceValidator {
  rules: StrictQueueVarianceRule[];

  constructor(rules: StrictQueueVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: StrictQueueVariance): string[] {
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

  requireValid(item: StrictQueueVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictQueueVariance[]): Map<string, string[]> {
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

export function defaultStrictQueueVarianceValidator(): StrictQueueVarianceValidator {
  return new StrictQueueVarianceValidator(
    [
      new StrictQueueVarianceCodeLengthRule(32),
      new StrictQueueVarianceRequiredTitleRule("strict queue variance needs this field"),
      new StrictQueueVarianceCodePrefixRule("REF"),
    ],
  );
}
