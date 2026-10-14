import { BadgeAdjustment } from "./badge-adjustment.js";

/** A rule a badge adjustment must pass. Check returns its problems, or none. */
export interface BadgeAdjustmentRule {
  check(item: BadgeAdjustment): string[];
}

export class BadgeAdjustmentCodeLengthRule implements BadgeAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeAdjustmentRequiredChecksumRule implements BadgeAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeAdjustment): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeAdjustmentSegmentLengthRule implements BadgeAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeAdjustment): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a badge adjustment. */
export class BadgeAdjustmentValidator {
  rules: BadgeAdjustmentRule[];

  constructor(rules: BadgeAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeAdjustment): string[] {
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

  requireValid(item: BadgeAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeAdjustment[]): Map<string, string[]> {
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

export function defaultBadgeAdjustmentValidator(): BadgeAdjustmentValidator {
  return new BadgeAdjustmentValidator(
    [
      new BadgeAdjustmentCodeLengthRule(32),
      new BadgeAdjustmentRequiredChecksumRule("badge adjustment needs a value"),
      new BadgeAdjustmentSegmentLengthRule(1000),
    ],
  );
}
