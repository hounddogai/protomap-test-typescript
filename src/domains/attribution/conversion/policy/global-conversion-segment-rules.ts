import { GlobalConversionSegment } from "./global-conversion-segment.js";

/** A rule a global conversion segment must pass. Check returns its problems, or none. */
export interface GlobalConversionSegmentRule {
  check(item: GlobalConversionSegment): string[];
}

export class GlobalConversionSegmentPriorityRangeRule implements GlobalConversionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalConversionSegment): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalConversionSegmentRequiredNameRule implements GlobalConversionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalConversionSegment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalConversionSegmentRequiredCodeRule implements GlobalConversionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalConversionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global conversion segment. */
export class GlobalConversionSegmentValidator {
  rules: GlobalConversionSegmentRule[];

  constructor(rules: GlobalConversionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalConversionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalConversionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalConversionSegment[]): Map<string, string[]> {
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

export function defaultGlobalConversionSegmentValidator(): GlobalConversionSegmentValidator {
  return new GlobalConversionSegmentValidator(
    [
      new GlobalConversionSegmentPriorityRangeRule(64, 255),
      new GlobalConversionSegmentRequiredNameRule("global conversion segment needs a value"),
      new GlobalConversionSegmentRequiredCodeRule("global conversion segment needs this field"),
    ],
  );
}
