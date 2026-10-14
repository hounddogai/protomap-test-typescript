import * as text from "../../../../kit/text.js";
import { RollingPacingBatch } from "./rolling-pacing-batch.js";

/** A rule a rolling pacing batch must pass. Check returns its problems, or none. */
export interface RollingPacingBatchRule {
  check(item: RollingPacingBatch): string[];
}

export class RollingPacingBatchRequiredTimezoneRule implements RollingPacingBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPacingBatch): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPacingBatchTimezoneLengthRule implements RollingPacingBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingBatch): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPacingBatchNameLengthRule implements RollingPacingBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPacingBatch): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPacingBatchCodePrefixRule implements RollingPacingBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingPacingBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingPacingBatchAllowedTimezoneRule implements RollingPacingBatchRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingPacingBatch): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is below minimum`];
    return [];
  }
}

export class RollingPacingBatchRequiredNameRule implements RollingPacingBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPacingBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling pacing batch. */
export class RollingPacingBatchValidator {
  rules: RollingPacingBatchRule[];

  constructor(rules: RollingPacingBatchRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPacingBatch): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPacingBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPacingBatch[]): Map<string, string[]> {
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

export function defaultRollingPacingBatchValidator(): RollingPacingBatchValidator {
  return new RollingPacingBatchValidator(
    [
      new RollingPacingBatchRequiredTimezoneRule("rolling pacing batch needs an entry"),
      new RollingPacingBatchTimezoneLengthRule(1000),
      new RollingPacingBatchNameLengthRule(80),
      new RollingPacingBatchCodePrefixRule("OPS"),
      new RollingPacingBatchAllowedTimezoneRule([]),
      new RollingPacingBatchRequiredNameRule("rolling pacing batch needs an entry"),
    ],
  );
}
