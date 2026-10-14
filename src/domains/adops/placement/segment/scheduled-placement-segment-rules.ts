import * as text from "../../../../kit/text.js";
import { ScheduledPlacementSegment } from "./scheduled-placement-segment.js";

/** A rule a scheduled placement segment must pass. Check returns its problems, or none. */
export interface ScheduledPlacementSegmentRule {
  check(item: ScheduledPlacementSegment): string[];
}

export class ScheduledPlacementSegmentNameLengthRule implements ScheduledPlacementSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledPlacementSegment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledPlacementSegmentAllowedOwnerIdRule implements ScheduledPlacementSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledPlacementSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is not allowed`];
    return [];
  }
}

export class ScheduledPlacementSegmentRequiredOwnerIdRule implements ScheduledPlacementSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPlacementSegment): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPlacementSegmentScoreRangeRule implements ScheduledPlacementSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPlacementSegment): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledPlacementSegmentImpressionsRangeRule implements ScheduledPlacementSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledPlacementSegment): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled placement segment. */
export class ScheduledPlacementSegmentValidator {
  rules: ScheduledPlacementSegmentRule[];

  constructor(rules: ScheduledPlacementSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPlacementSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPlacementSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPlacementSegment[]): Map<string, string[]> {
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

export function defaultScheduledPlacementSegmentValidator(): ScheduledPlacementSegmentValidator {
  return new ScheduledPlacementSegmentValidator(
    [
      new ScheduledPlacementSegmentNameLengthRule(255),
      new ScheduledPlacementSegmentAllowedOwnerIdRule(["seasonal", "batched"]),
      new ScheduledPlacementSegmentRequiredOwnerIdRule("scheduled placement segment needs this field"),
      new ScheduledPlacementSegmentScoreRangeRule(6.1, 4604.3),
      new ScheduledPlacementSegmentImpressionsRangeRule(32, 255),
    ],
  );
}
