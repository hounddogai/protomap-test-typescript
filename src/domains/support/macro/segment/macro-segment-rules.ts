import { MacroSegment } from "./macro-segment.js";

/** A rule a macro segment must pass. Check returns its problems, or none. */
export interface MacroSegmentRule {
  check(item: MacroSegment): string[];
}

export class MacroSegmentRequiredCodeRule implements MacroSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MacroSegmentLabelLengthRule implements MacroSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroSegmentFloorValueRangeRule implements MacroSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroSegment): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MacroSegmentRequiredRegionRule implements MacroSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroSegment): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a macro segment. */
export class MacroSegmentValidator {
  rules: MacroSegmentRule[];

  constructor(rules: MacroSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: MacroSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroSegment[]): Map<string, string[]> {
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

export function defaultMacroSegmentValidator(): MacroSegmentValidator {
  return new MacroSegmentValidator(
    [
      new MacroSegmentRequiredCodeRule("macro segment needs this field"),
      new MacroSegmentLabelLengthRule(255),
      new MacroSegmentFloorValueRangeRule(1.4, 1300.4),
      new MacroSegmentRequiredRegionRule("macro segment needs a value"),
    ],
  );
}
