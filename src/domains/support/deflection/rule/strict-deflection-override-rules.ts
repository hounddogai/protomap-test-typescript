import { StrictDeflectionOverride } from "./strict-deflection-override.js";

/** A rule a strict deflection override must pass. Check returns its problems, or none. */
export interface StrictDeflectionOverrideRule {
  check(item: StrictDeflectionOverride): string[];
}

export class StrictDeflectionOverrideRequiredTitleRule implements StrictDeflectionOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictDeflectionOverride): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictDeflectionOverrideChannelLengthRule implements StrictDeflectionOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictDeflectionOverride): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictDeflectionOverrideRatioRangeRule implements StrictDeflectionOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictDeflectionOverride): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict deflection override. */
export class StrictDeflectionOverrideValidator {
  rules: StrictDeflectionOverrideRule[];

  constructor(rules: StrictDeflectionOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: StrictDeflectionOverride): string[] {
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

  requireValid(item: StrictDeflectionOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictDeflectionOverride[]): Map<string, string[]> {
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

export function defaultStrictDeflectionOverrideValidator(): StrictDeflectionOverrideValidator {
  return new StrictDeflectionOverrideValidator(
    [
      new StrictDeflectionOverrideRequiredTitleRule("strict deflection override needs an entry"),
      new StrictDeflectionOverrideChannelLengthRule(64),
      new StrictDeflectionOverrideRatioRangeRule(5.4, 2516.3),
    ],
  );
}
