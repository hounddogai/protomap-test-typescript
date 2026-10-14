import { PathPolicy } from "./path-policy.js";

/** A rule a path policy must pass. Check returns its problems, or none. */
export interface PathPolicyRule {
  check(item: PathPolicy): string[];
}

export class PathPolicyQuantityRangeRule implements PathPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathPolicy): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathPolicyCodePrefixRule implements PathPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathPolicyRequiredTitleRule implements PathPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PathPolicySourceLengthRule implements PathPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathPolicy): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathPolicyTitleLengthRule implements PathPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathPolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a path policy. */
export class PathPolicyValidator {
  rules: PathPolicyRule[];

  constructor(rules: PathPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PathPolicy): string[] {
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

  requireValid(item: PathPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathPolicy[]): Map<string, string[]> {
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

export function defaultPathPolicyValidator(): PathPolicyValidator {
  return new PathPolicyValidator(
    [
      new PathPolicyQuantityRangeRule(80, 86400),
      new PathPolicyCodePrefixRule("REF"),
      new PathPolicyRequiredTitleRule("path policy needs a value"),
      new PathPolicySourceLengthRule(255),
      new PathPolicyTitleLengthRule(3600),
    ],
  );
}
