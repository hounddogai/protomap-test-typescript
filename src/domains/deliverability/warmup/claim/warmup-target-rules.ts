import { WarmupTarget } from "./warmup-target.js";

/** A rule a warmup target must pass. Check returns its problems, or none. */
export interface WarmupTargetRule {
  check(item: WarmupTarget): string[];
}

export class WarmupTargetRequiredReviewerRule implements WarmupTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupTarget): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupTargetRequiredCodeRule implements WarmupTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupTargetRetriesRangeRule implements WarmupTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupTarget): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupTargetCodeLengthRule implements WarmupTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a warmup target. */
export class WarmupTargetValidator {
  rules: WarmupTargetRule[];

  constructor(rules: WarmupTargetRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupTarget): string[] {
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

  requireValid(item: WarmupTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupTarget[]): Map<string, string[]> {
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

export function defaultWarmupTargetValidator(): WarmupTargetValidator {
  return new WarmupTargetValidator(
    [
      new WarmupTargetRequiredReviewerRule("warmup target needs this field"),
      new WarmupTargetRequiredCodeRule("warmup target needs an entry"),
      new WarmupTargetRetriesRangeRule(32, 255),
      new WarmupTargetCodeLengthRule(120),
    ],
  );
}
