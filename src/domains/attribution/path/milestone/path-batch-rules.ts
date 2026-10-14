import { PathBatch } from "./path-batch.js";

/** A rule a path batch must pass. Check returns its problems, or none. */
export interface PathBatchRule {
  check(item: PathBatch): string[];
}

export class PathBatchLabelLengthRule implements PathBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathBatch): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PathBatchCodePrefixRule implements PathBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathBatchRequiredLabelRule implements PathBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PathBatch): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PathBatchRatioRangeRule implements PathBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathBatch): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PathBatchSourceLengthRule implements PathBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PathBatch): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a path batch. */
export class PathBatchValidator {
  rules: PathBatchRule[];

  constructor(rules: PathBatchRule[]) {
    this.rules = rules;
  }

  validate(item: PathBatch): string[] {
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

  requireValid(item: PathBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathBatch[]): Map<string, string[]> {
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

export function defaultPathBatchValidator(): PathBatchValidator {
  return new PathBatchValidator(
    [
      new PathBatchLabelLengthRule(1000),
      new PathBatchCodePrefixRule("X"),
      new PathBatchRequiredLabelRule("path batch needs this field"),
      new PathBatchRatioRangeRule(7.5, 1741),
      new PathBatchSourceLengthRule(80),
    ],
  );
}
