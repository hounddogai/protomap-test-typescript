import { ModelSnapshot } from "./model-snapshot.js";

/** A rule a model snapshot must pass. Check returns its problems, or none. */
export interface ModelSnapshotRule {
  check(item: ModelSnapshot): string[];
}

export class ModelSnapshotCodeLengthRule implements ModelSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelSnapshotDescriptionLengthRule implements ModelSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelSnapshot): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelSnapshotRequiredDescriptionRule implements ModelSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelSnapshot): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model snapshot. */
export class ModelSnapshotValidator {
  rules: ModelSnapshotRule[];

  constructor(rules: ModelSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: ModelSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelSnapshot[]): Map<string, string[]> {
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

export function defaultModelSnapshotValidator(): ModelSnapshotValidator {
  return new ModelSnapshotValidator(
    [
      new ModelSnapshotCodeLengthRule(255),
      new ModelSnapshotDescriptionLengthRule(255),
      new ModelSnapshotRequiredDescriptionRule("model snapshot needs this field"),
    ],
  );
}
