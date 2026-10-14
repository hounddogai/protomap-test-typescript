import { RollingLevelBatch } from "./rolling-level-batch.js";

/** A rule a rolling level batch must pass. Check returns its problems, or none. */
export interface RollingLevelBatchRule {
  check(item: RollingLevelBatch): string[];
}

export class RollingLevelBatchRequiredCodeRule implements RollingLevelBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLevelBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingLevelBatchCodeLengthRule implements RollingLevelBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLevelBatch): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingLevelBatchAudienceIdLengthRule implements RollingLevelBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLevelBatch): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling level batch. */
export class RollingLevelBatchValidator {
  rules: RollingLevelBatchRule[];

  constructor(rules: RollingLevelBatchRule[]) {
    this.rules = rules;
  }

  validate(item: RollingLevelBatch): string[] {
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

  requireValid(item: RollingLevelBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingLevelBatch[]): Map<string, string[]> {
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

export function defaultRollingLevelBatchValidator(): RollingLevelBatchValidator {
  return new RollingLevelBatchValidator(
    [
      new RollingLevelBatchRequiredCodeRule("rolling level batch needs a value"),
      new RollingLevelBatchCodeLengthRule(64),
      new RollingLevelBatchAudienceIdLengthRule(3600),
    ],
  );
}
