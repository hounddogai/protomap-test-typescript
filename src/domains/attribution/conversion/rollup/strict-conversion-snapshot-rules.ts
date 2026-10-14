import { StrictConversionSnapshot } from "./strict-conversion-snapshot.js";

/** A rule a strict conversion snapshot must pass. Check returns its problems, or none. */
export interface StrictConversionSnapshotRule {
  check(item: StrictConversionSnapshot): string[];
}

export class StrictConversionSnapshotLabelLengthRule implements StrictConversionSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictConversionSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictConversionSnapshotRequiredCodeRule implements StrictConversionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictConversionSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictConversionSnapshotRequiredChannelRule implements StrictConversionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictConversionSnapshot): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class StrictConversionSnapshotRequiredLabelRule implements StrictConversionSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictConversionSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict conversion snapshot. */
export class StrictConversionSnapshotValidator {
  rules: StrictConversionSnapshotRule[];

  constructor(rules: StrictConversionSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: StrictConversionSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictConversionSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictConversionSnapshot[]): Map<string, string[]> {
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

export function defaultStrictConversionSnapshotValidator(): StrictConversionSnapshotValidator {
  return new StrictConversionSnapshotValidator(
    [
      new StrictConversionSnapshotLabelLengthRule(86400),
      new StrictConversionSnapshotRequiredCodeRule("strict conversion snapshot needs a value"),
      new StrictConversionSnapshotRequiredChannelRule("strict conversion snapshot needs this field"),
      new StrictConversionSnapshotRequiredLabelRule("strict conversion snapshot needs an entry"),
    ],
  );
}
