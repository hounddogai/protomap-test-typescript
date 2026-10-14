import { InsightSnapshot } from "./insight-snapshot.js";

/** A rule a insight snapshot must pass. Check returns its problems, or none. */
export interface InsightSnapshotRule {
  check(item: InsightSnapshot): string[];
}

export class InsightSnapshotRegionLengthRule implements InsightSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightSnapshot): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightSnapshotRequiredCodeRule implements InsightSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InsightSnapshotRequiredNameRule implements InsightSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightSnapshot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class InsightSnapshotRequiredAudienceIdRule implements InsightSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightSnapshot): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight snapshot. */
export class InsightSnapshotValidator {
  rules: InsightSnapshotRule[];

  constructor(rules: InsightSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: InsightSnapshot): string[] {
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

  requireValid(item: InsightSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightSnapshot[]): Map<string, string[]> {
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

export function defaultInsightSnapshotValidator(): InsightSnapshotValidator {
  return new InsightSnapshotValidator(
    [
      new InsightSnapshotRegionLengthRule(32),
      new InsightSnapshotRequiredCodeRule("insight snapshot needs a value"),
      new InsightSnapshotRequiredNameRule("insight snapshot needs an entry"),
      new InsightSnapshotRequiredAudienceIdRule("insight snapshot needs an entry"),
    ],
  );
}
