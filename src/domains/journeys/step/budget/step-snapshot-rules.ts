import { StepSnapshot } from "./step-snapshot.js";

/** A rule a step snapshot must pass. Check returns its problems, or none. */
export interface StepSnapshotRule {
  check(item: StepSnapshot): string[];
}

export class StepSnapshotNameLengthRule implements StepSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepSnapshot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepSnapshotUtmSourceLengthRule implements StepSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepSnapshot): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepSnapshotRequiredNameRule implements StepSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepSnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step snapshot. */
export class StepSnapshotValidator {
  rules: StepSnapshotRule[];

  constructor(rules: StepSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: StepSnapshot): string[] {
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

  requireValid(item: StepSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepSnapshot[]): Map<string, string[]> {
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

export function defaultStepSnapshotValidator(): StepSnapshotValidator {
  return new StepSnapshotValidator(
    [
      new StepSnapshotNameLengthRule(86400),
      new StepSnapshotUtmSourceLengthRule(80),
      new StepSnapshotRequiredNameRule("step snapshot needs an entry"),
    ],
  );
}
