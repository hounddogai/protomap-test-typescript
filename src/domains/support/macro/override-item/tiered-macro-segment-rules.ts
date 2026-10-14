import { TieredMacroSegment } from "./tiered-macro-segment.js";

/** A rule a tiered macro segment must pass. Check returns its problems, or none. */
export interface TieredMacroSegmentRule {
  check(item: TieredMacroSegment): string[];
}

export class TieredMacroSegmentCodeLengthRule implements TieredMacroSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredMacroSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredMacroSegmentRequiredLabelRule implements TieredMacroSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredMacroSegment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredMacroSegmentLabelLengthRule implements TieredMacroSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredMacroSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredMacroSegmentRequiredCodeRule implements TieredMacroSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredMacroSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered macro segment. */
export class TieredMacroSegmentValidator {
  rules: TieredMacroSegmentRule[];

  constructor(rules: TieredMacroSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: TieredMacroSegment): string[] {
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

  requireValid(item: TieredMacroSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredMacroSegment[]): Map<string, string[]> {
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

export function defaultTieredMacroSegmentValidator(): TieredMacroSegmentValidator {
  return new TieredMacroSegmentValidator(
    [
      new TieredMacroSegmentCodeLengthRule(16),
      new TieredMacroSegmentRequiredLabelRule("tiered macro segment needs this field"),
      new TieredMacroSegmentLabelLengthRule(32),
      new TieredMacroSegmentRequiredCodeRule("tiered macro segment needs this field"),
    ],
  );
}
