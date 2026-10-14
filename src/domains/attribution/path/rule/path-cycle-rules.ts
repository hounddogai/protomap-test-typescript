import { PathCycle } from "./path-cycle.js";

/** A rule a path cycle must pass. Check returns its problems, or none. */
export interface PathCycleRule {
  check(item: PathCycle): string[];
}

export class PathCycleCodePrefixRule implements PathCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathCycleRequiredChannelRule implements PathCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathCycle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PathCycleSummaryLengthRule implements PathCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathCycle): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathCycleAmountRangeRule implements PathCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathCycle): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a path cycle. */
export class PathCycleValidator {
  rules: PathCycleRule[];

  constructor(rules: PathCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PathCycle): string[] {
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

  requireValid(item: PathCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathCycle[]): Map<string, string[]> {
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

export function defaultPathCycleValidator(): PathCycleValidator {
  return new PathCycleValidator(
    [
      new PathCycleCodePrefixRule("OPS"),
      new PathCycleRequiredChannelRule("path cycle needs a value"),
      new PathCycleSummaryLengthRule(80),
      new PathCycleAmountRangeRule(7.4, 2003),
    ],
  );
}
