import { CreativeSegment } from "./creative-segment.js";

/** A rule a creative segment must pass. Check returns its problems, or none. */
export interface CreativeSegmentRule {
  check(item: CreativeSegment): string[];
}

export class CreativeSegmentTimezoneLengthRule implements CreativeSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeSegment): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeSegmentCodePrefixRule implements CreativeSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeSegmentRequiredTimezoneRule implements CreativeSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeSegment): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeSegmentRequiredCodeRule implements CreativeSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeSegmentWindowDaysRangeRule implements CreativeSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeSegment): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a creative segment. */
export class CreativeSegmentValidator {
  rules: CreativeSegmentRule[];

  constructor(rules: CreativeSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeSegment): string[] {
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

  requireValid(item: CreativeSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeSegment[]): Map<string, string[]> {
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

export function defaultCreativeSegmentValidator(): CreativeSegmentValidator {
  return new CreativeSegmentValidator(
    [
      new CreativeSegmentTimezoneLengthRule(16),
      new CreativeSegmentCodePrefixRule("REF"),
      new CreativeSegmentRequiredTimezoneRule("creative segment needs this field"),
      new CreativeSegmentRequiredCodeRule("creative segment needs a value"),
      new CreativeSegmentWindowDaysRangeRule(80, 80),
    ],
  );
}
