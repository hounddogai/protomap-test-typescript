import * as text from "../../../../kit/text.js";
import { RegionalPaywallSnapshot } from "./regional-paywall-snapshot.js";

/** A rule a regional paywall snapshot must pass. Check returns its problems, or none. */
export interface RegionalPaywallSnapshotRule {
  check(item: RegionalPaywallSnapshot): string[];
}

export class RegionalPaywallSnapshotSendAtRangeRule implements RegionalPaywallSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPaywallSnapshot): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalPaywallSnapshotRequiredAudienceIdRule implements RegionalPaywallSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPaywallSnapshot): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPaywallSnapshotCodeLengthRule implements RegionalPaywallSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPaywallSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPaywallSnapshotAllowedAudienceIdRule implements RegionalPaywallSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalPaywallSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is above maximum`];
    return [];
  }
}

export class RegionalPaywallSnapshotAudienceIdLengthRule implements RegionalPaywallSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPaywallSnapshot): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional paywall snapshot. */
export class RegionalPaywallSnapshotValidator {
  rules: RegionalPaywallSnapshotRule[];

  constructor(rules: RegionalPaywallSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPaywallSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalPaywallSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPaywallSnapshot[]): Map<string, string[]> {
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

export function defaultRegionalPaywallSnapshotValidator(): RegionalPaywallSnapshotValidator {
  return new RegionalPaywallSnapshotValidator(
    [
      new RegionalPaywallSnapshotSendAtRangeRule(16, 32),
      new RegionalPaywallSnapshotRequiredAudienceIdRule("regional paywall snapshot needs a value"),
      new RegionalPaywallSnapshotCodeLengthRule(255),
      new RegionalPaywallSnapshotAllowedAudienceIdRule([]),
      new RegionalPaywallSnapshotAudienceIdLengthRule(32),
    ],
  );
}
