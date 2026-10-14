import * as text from "../../../../kit/text.js";
import { SlaGroup } from "./sla-group.js";

/** A rule a sla group must pass. Check returns its problems, or none. */
export interface SlaGroupRule {
  check(item: SlaGroup): string[];
}

export class SlaGroupAllowedTimezoneRule implements SlaGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is expired`];
    return [];
  }
}

export class SlaGroupTimezoneLengthRule implements SlaGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaGroup): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaGroupCodeLengthRule implements SlaGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaGroupArchivedGuardRule implements SlaGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SlaGroup): string[] {
    if (item.archived && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class SlaGroupSequenceRangeRule implements SlaGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaGroup): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a sla group. */
export class SlaGroupValidator {
  rules: SlaGroupRule[];

  constructor(rules: SlaGroupRule[]) {
    this.rules = rules;
  }

  validate(item: SlaGroup): string[] {
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

  requireValid(item: SlaGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaGroup[]): Map<string, string[]> {
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

export function defaultSlaGroupValidator(): SlaGroupValidator {
  return new SlaGroupValidator(
    [
      new SlaGroupAllowedTimezoneRule(["rolling", "batched"]),
      new SlaGroupTimezoneLengthRule(120),
      new SlaGroupCodeLengthRule(255),
      new SlaGroupArchivedGuardRule(3600),
      new SlaGroupSequenceRangeRule(16, 1000),
    ],
  );
}
