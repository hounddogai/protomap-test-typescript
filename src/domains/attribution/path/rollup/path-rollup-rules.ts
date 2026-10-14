import * as text from "../../../../kit/text.js";
import { PathRollup } from "./path-rollup.js";

/** A rule a path rollup must pass. Check returns its problems, or none. */
export interface PathRollupRule {
  check(item: PathRollup): string[];
}

export class PathRollupCodePrefixRule implements PathRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathRollupRequiredCodeRule implements PathRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PathRollupRequiredUtmSourceRule implements PathRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathRollup): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PathRollupFrequencyCapRangeRule implements PathRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathRollup): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathRollupAllowedUtmSourceRule implements PathRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is below minimum`];
    return [];
  }
}

export class PathRollupRequiredTitleRule implements PathRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path rollup. */
export class PathRollupValidator {
  rules: PathRollupRule[];

  constructor(rules: PathRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PathRollup): string[] {
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

  requireValid(item: PathRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathRollup[]): Map<string, string[]> {
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

export function defaultPathRollupValidator(): PathRollupValidator {
  return new PathRollupValidator(
    [
      new PathRollupCodePrefixRule("REF"),
      new PathRollupRequiredCodeRule("path rollup needs a value"),
      new PathRollupRequiredUtmSourceRule("path rollup needs this field"),
      new PathRollupFrequencyCapRangeRule(64, 86400),
      new PathRollupAllowedUtmSourceRule([]),
      new PathRollupRequiredTitleRule("path rollup needs an entry"),
    ],
  );
}
