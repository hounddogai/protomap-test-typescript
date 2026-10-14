import * as text from "../../../../kit/text.js";
import { LenientReputationAssignment } from "./lenient-reputation-assignment.js";

/** A rule a lenient reputation assignment must pass. Check returns its problems, or none. */
export interface LenientReputationAssignmentRule {
  check(item: LenientReputationAssignment): string[];
}

export class LenientReputationAssignmentWeightRangeRule implements LenientReputationAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientReputationAssignment): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientReputationAssignmentOpenRateRangeRule implements LenientReputationAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientReputationAssignment): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientReputationAssignmentAllowedCodeRule implements LenientReputationAssignmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientReputationAssignment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class LenientReputationAssignmentRequiredNameRule implements LenientReputationAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientReputationAssignment): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientReputationAssignmentDurationMinutesRangeRule implements LenientReputationAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientReputationAssignment): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient reputation assignment. */
export class LenientReputationAssignmentValidator {
  rules: LenientReputationAssignmentRule[];

  constructor(rules: LenientReputationAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: LenientReputationAssignment): string[] {
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

  requireValid(item: LenientReputationAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientReputationAssignment[]): Map<string, string[]> {
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

export function defaultLenientReputationAssignmentValidator(): LenientReputationAssignmentValidator {
  return new LenientReputationAssignmentValidator(
    [
      new LenientReputationAssignmentWeightRangeRule(8.6, 2652.1),
      new LenientReputationAssignmentOpenRateRangeRule(8.1, 4750.5),
      new LenientReputationAssignmentAllowedCodeRule(["strict"]),
      new LenientReputationAssignmentRequiredNameRule("lenient reputation assignment needs an entry"),
      new LenientReputationAssignmentDurationMinutesRangeRule(120, 1000),
    ],
  );
}
