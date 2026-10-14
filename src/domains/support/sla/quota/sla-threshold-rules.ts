import * as text from "../../../../kit/text.js";
import { SlaThreshold } from "./sla-threshold.js";

/** A rule a sla threshold must pass. Check returns its problems, or none. */
export interface SlaThresholdRule {
  check(item: SlaThreshold): string[];
}

export class SlaThresholdRequiredSegmentRule implements SlaThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaThreshold): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class SlaThresholdAllowedOwnerIdRule implements SlaThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is out of range`];
    return [];
  }
}

export class SlaThresholdUtmSourceLengthRule implements SlaThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaThreshold): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaThresholdCodeLengthRule implements SlaThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaThresholdPriorityRangeRule implements SlaThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaThreshold): string[] {
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

/** Runs every rule of a sla threshold. */
export class SlaThresholdValidator {
  rules: SlaThresholdRule[];

  constructor(rules: SlaThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: SlaThreshold): string[] {
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

  requireValid(item: SlaThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaThreshold[]): Map<string, string[]> {
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

export function defaultSlaThresholdValidator(): SlaThresholdValidator {
  return new SlaThresholdValidator(
    [
      new SlaThresholdRequiredSegmentRule("sla threshold needs this field"),
      new SlaThresholdAllowedOwnerIdRule([]),
      new SlaThresholdUtmSourceLengthRule(1000),
      new SlaThresholdCodeLengthRule(64),
      new SlaThresholdPriorityRangeRule(32, 1000),
    ],
  );
}
