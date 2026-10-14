import { InsightCheckpoint } from "./insight-checkpoint.js";

/** A rule a insight checkpoint must pass. Check returns its problems, or none. */
export interface InsightCheckpointRule {
  check(item: InsightCheckpoint): string[];
}

export class InsightCheckpointSegmentLengthRule implements InsightCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightCheckpoint): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightCheckpointCodePrefixRule implements InsightCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InsightCheckpointArchivedGuardRule implements InsightCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: InsightCheckpoint): string[] {
    if (item.archived && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class InsightCheckpointRequiredVariantRule implements InsightCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightCheckpoint): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class InsightCheckpointRequiredCodeRule implements InsightCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightCheckpointVersionRangeRule implements InsightCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightCheckpoint): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a insight checkpoint. */
export class InsightCheckpointValidator {
  rules: InsightCheckpointRule[];

  constructor(rules: InsightCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: InsightCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightCheckpoint[]): Map<string, string[]> {
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

export function defaultInsightCheckpointValidator(): InsightCheckpointValidator {
  return new InsightCheckpointValidator(
    [
      new InsightCheckpointSegmentLengthRule(64),
      new InsightCheckpointCodePrefixRule("Q"),
      new InsightCheckpointArchivedGuardRule(1.8),
      new InsightCheckpointRequiredVariantRule("insight checkpoint needs an entry"),
      new InsightCheckpointRequiredCodeRule("insight checkpoint needs a value"),
      new InsightCheckpointVersionRangeRule(64, 3600),
    ],
  );
}
