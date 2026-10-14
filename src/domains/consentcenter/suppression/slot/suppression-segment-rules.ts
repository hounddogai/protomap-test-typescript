import { SuppressionSegment } from "./suppression-segment.js";

/** A rule a suppression segment must pass. Check returns its problems, or none. */
export interface SuppressionSegmentRule {
  check(item: SuppressionSegment): string[];
}

export class SuppressionSegmentCodeLengthRule implements SuppressionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionSegmentRequiredLocaleRule implements SuppressionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionSegment): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionSegmentRequiredCodeRule implements SuppressionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionSegmentLocaleLengthRule implements SuppressionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionSegment): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a suppression segment. */
export class SuppressionSegmentValidator {
  rules: SuppressionSegmentRule[];

  constructor(rules: SuppressionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionSegment): string[] {
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

  requireValid(item: SuppressionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionSegment[]): Map<string, string[]> {
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

export function defaultSuppressionSegmentValidator(): SuppressionSegmentValidator {
  return new SuppressionSegmentValidator(
    [
      new SuppressionSegmentCodeLengthRule(1000),
      new SuppressionSegmentRequiredLocaleRule("suppression segment needs this field"),
      new SuppressionSegmentRequiredCodeRule("suppression segment needs a value"),
      new SuppressionSegmentLocaleLengthRule(120),
    ],
  );
}
