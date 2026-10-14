import { SeasonalMacroSegment } from "./seasonal-macro-segment.js";

/** A rule a seasonal macro segment must pass. Check returns its problems, or none. */
export interface SeasonalMacroSegmentRule {
  check(item: SeasonalMacroSegment): string[];
}

export class SeasonalMacroSegmentRequiredPhoneRule implements SeasonalMacroSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMacroSegment): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalMacroSegmentRateRangeRule implements SeasonalMacroSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalMacroSegment): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalMacroSegmentNameLengthRule implements SeasonalMacroSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalMacroSegment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalMacroSegmentSourceLengthRule implements SeasonalMacroSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalMacroSegment): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal macro segment. */
export class SeasonalMacroSegmentValidator {
  rules: SeasonalMacroSegmentRule[];

  constructor(rules: SeasonalMacroSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalMacroSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalMacroSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalMacroSegment[]): Map<string, string[]> {
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

export function defaultSeasonalMacroSegmentValidator(): SeasonalMacroSegmentValidator {
  return new SeasonalMacroSegmentValidator(
    [
      new SeasonalMacroSegmentRequiredPhoneRule("seasonal macro segment needs an entry"),
      new SeasonalMacroSegmentRateRangeRule(6.3, 2225.5),
      new SeasonalMacroSegmentNameLengthRule(1000),
      new SeasonalMacroSegmentSourceLengthRule(80),
    ],
  );
}
