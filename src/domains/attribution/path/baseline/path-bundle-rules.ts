import { PathBundle } from "./path-bundle.js";

/** A rule a path bundle must pass. Check returns its problems, or none. */
export interface PathBundleRule {
  check(item: PathBundle): string[];
}

export class PathBundleCodeLengthRule implements PathBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathBundleStartsAtRangeRule implements PathBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathBundle): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathBundleCodePrefixRule implements PathBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathBundleRequiredChannelRule implements PathBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathBundle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a path bundle. */
export class PathBundleValidator {
  rules: PathBundleRule[];

  constructor(rules: PathBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PathBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathBundle[]): Map<string, string[]> {
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

export function defaultPathBundleValidator(): PathBundleValidator {
  return new PathBundleValidator(
    [
      new PathBundleCodeLengthRule(86400),
      new PathBundleStartsAtRangeRule(64, 86400),
      new PathBundleCodePrefixRule("ACM"),
      new PathBundleRequiredChannelRule("path bundle needs an entry"),
    ],
  );
}
