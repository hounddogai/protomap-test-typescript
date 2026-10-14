import * as text from "../../../../kit/text.js";
import { PlacementSegment } from "./placement-segment.js";

/** A rule a placement segment must pass. Check returns its problems, or none. */
export interface PlacementSegmentRule {
  check(item: PlacementSegment): string[];
}

export class PlacementSegmentCodePrefixRule implements PlacementSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PlacementSegmentTitleLengthRule implements PlacementSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementSegment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementSegmentAllowedUnitRule implements PlacementSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is below minimum`];
    return [];
  }
}

/** Runs every rule of a placement segment. */
export class PlacementSegmentValidator {
  rules: PlacementSegmentRule[];

  constructor(rules: PlacementSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementSegment[]): Map<string, string[]> {
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

export function defaultPlacementSegmentValidator(): PlacementSegmentValidator {
  return new PlacementSegmentValidator(
    [
      new PlacementSegmentCodePrefixRule("REF"),
      new PlacementSegmentTitleLengthRule(80),
      new PlacementSegmentAllowedUnitRule([]),
    ],
  );
}
