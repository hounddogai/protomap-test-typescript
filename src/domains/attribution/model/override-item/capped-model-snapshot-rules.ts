import { CappedModelSnapshot } from "./capped-model-snapshot.js";

/** A rule a capped model snapshot must pass. Check returns its problems, or none. */
export interface CappedModelSnapshotRule {
  check(item: CappedModelSnapshot): string[];
}

export class CappedModelSnapshotNameLengthRule implements CappedModelSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedModelSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedModelSnapshotCodePrefixRule implements CappedModelSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedModelSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedModelSnapshotUpdatedAtRangeRule implements CappedModelSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedModelSnapshot): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedModelSnapshotUnitLengthRule implements CappedModelSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedModelSnapshot): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedModelSnapshotRequiredNameRule implements CappedModelSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedModelSnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped model snapshot. */
export class CappedModelSnapshotValidator {
  rules: CappedModelSnapshotRule[];

  constructor(rules: CappedModelSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: CappedModelSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedModelSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedModelSnapshot[]): Map<string, string[]> {
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

export function defaultCappedModelSnapshotValidator(): CappedModelSnapshotValidator {
  return new CappedModelSnapshotValidator(
    [
      new CappedModelSnapshotNameLengthRule(86400),
      new CappedModelSnapshotCodePrefixRule("Q"),
      new CappedModelSnapshotUpdatedAtRangeRule(64, 80),
      new CappedModelSnapshotUnitLengthRule(32),
      new CappedModelSnapshotRequiredNameRule("capped model snapshot needs this field"),
    ],
  );
}
