import { LenientCreativeRequest } from "./lenient-creative-request.js";

/** A rule a lenient creative request must pass. Check returns its problems, or none. */
export interface LenientCreativeRequestRule {
  check(item: LenientCreativeRequest): string[];
}

export class LenientCreativeRequestRequiredCodeRule implements LenientCreativeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCreativeRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCreativeRequestCodePrefixRule implements LenientCreativeRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientCreativeRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientCreativeRequestScoreRangeRule implements LenientCreativeRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCreativeRequest): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientCreativeRequestAttemptsRangeRule implements LenientCreativeRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCreativeRequest): string[] {
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

/** Runs every rule of a lenient creative request. */
export class LenientCreativeRequestValidator {
  rules: LenientCreativeRequestRule[];

  constructor(rules: LenientCreativeRequestRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCreativeRequest): string[] {
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

  requireValid(item: LenientCreativeRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCreativeRequest[]): Map<string, string[]> {
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

export function defaultLenientCreativeRequestValidator(): LenientCreativeRequestValidator {
  return new LenientCreativeRequestValidator(
    [
      new LenientCreativeRequestRequiredCodeRule("lenient creative request needs this field"),
      new LenientCreativeRequestCodePrefixRule("X"),
      new LenientCreativeRequestScoreRangeRule(4.1, 4802.3),
      new LenientCreativeRequestAttemptsRangeRule(16, 32),
    ],
  );
}
