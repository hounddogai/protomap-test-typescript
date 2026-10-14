import { SeasonalTouchpointSegment } from "./seasonal-touchpoint-segment.js";

/** A rule a seasonal touchpoint segment must pass. Check returns its problems, or none. */
export interface SeasonalTouchpointSegmentRule {
  check(item: SeasonalTouchpointSegment): string[];
}

export class SeasonalTouchpointSegmentCodeLengthRule implements SeasonalTouchpointSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTouchpointSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTouchpointSegmentChecksumLengthRule implements SeasonalTouchpointSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTouchpointSegment): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTouchpointSegmentLabelLengthRule implements SeasonalTouchpointSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTouchpointSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTouchpointSegmentRequiredCodeRule implements SeasonalTouchpointSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalTouchpointSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal touchpoint segment. */
export class SeasonalTouchpointSegmentValidator {
  rules: SeasonalTouchpointSegmentRule[];

  constructor(rules: SeasonalTouchpointSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalTouchpointSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalTouchpointSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalTouchpointSegment[]): Map<string, string[]> {
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

export function defaultSeasonalTouchpointSegmentValidator(): SeasonalTouchpointSegmentValidator {
  return new SeasonalTouchpointSegmentValidator(
    [
      new SeasonalTouchpointSegmentCodeLengthRule(255),
      new SeasonalTouchpointSegmentChecksumLengthRule(3600),
      new SeasonalTouchpointSegmentLabelLengthRule(1000),
      new SeasonalTouchpointSegmentRequiredCodeRule("seasonal touchpoint segment needs this field"),
    ],
  );
}
