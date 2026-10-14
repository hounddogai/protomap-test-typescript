import { PendingLevelCycle } from "./pending-level-cycle.js";

/** A rule a pending level cycle must pass. Check returns its problems, or none. */
export interface PendingLevelCycleRule {
  check(item: PendingLevelCycle): string[];
}

export class PendingLevelCycleRequiredAudienceIdRule implements PendingLevelCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelCycle): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLevelCycleImpressionsRangeRule implements PendingLevelCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingLevelCycle): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingLevelCycleRequiredLabelRule implements PendingLevelCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingLevelCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingLevelCycleAudienceIdLengthRule implements PendingLevelCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelCycle): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingLevelCycleCodeLengthRule implements PendingLevelCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingLevelCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending level cycle. */
export class PendingLevelCycleValidator {
  rules: PendingLevelCycleRule[];

  constructor(rules: PendingLevelCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingLevelCycle): string[] {
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

  requireValid(item: PendingLevelCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingLevelCycle[]): Map<string, string[]> {
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

export function defaultPendingLevelCycleValidator(): PendingLevelCycleValidator {
  return new PendingLevelCycleValidator(
    [
      new PendingLevelCycleRequiredAudienceIdRule("pending level cycle needs this field"),
      new PendingLevelCycleImpressionsRangeRule(80, 3600),
      new PendingLevelCycleRequiredLabelRule("pending level cycle needs a value"),
      new PendingLevelCycleAudienceIdLengthRule(120),
      new PendingLevelCycleCodeLengthRule(16),
    ],
  );
}
