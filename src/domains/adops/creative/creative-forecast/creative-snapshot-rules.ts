import { CreativeSnapshot } from "./creative-snapshot.js";

/** A rule a creative snapshot must pass. Check returns its problems, or none. */
export interface CreativeSnapshotRule {
  check(item: CreativeSnapshot): string[];
}

export class CreativeSnapshotRequiredSegmentRule implements CreativeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeSnapshot): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeSnapshotRequiredLabelRule implements CreativeSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeSnapshotLabelLengthRule implements CreativeSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeSnapshot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeSnapshotBidRangeRule implements CreativeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeSnapshot): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeSnapshotAmountRangeRule implements CreativeSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeSnapshot): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a creative snapshot. */
export class CreativeSnapshotValidator {
  rules: CreativeSnapshotRule[];

  constructor(rules: CreativeSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeSnapshot[]): Map<string, string[]> {
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

export function defaultCreativeSnapshotValidator(): CreativeSnapshotValidator {
  return new CreativeSnapshotValidator(
    [
      new CreativeSnapshotRequiredSegmentRule("creative snapshot needs an entry"),
      new CreativeSnapshotRequiredLabelRule("creative snapshot needs an entry"),
      new CreativeSnapshotLabelLengthRule(86400),
      new CreativeSnapshotBidRangeRule(1.5, 515.8),
      new CreativeSnapshotAmountRangeRule(5.3, 2797.7),
    ],
  );
}
