import * as text from "../../../../kit/text.js";
import { PendingReputationCheckpoint } from "./pending-reputation-checkpoint.js";

/** A rule a pending reputation checkpoint must pass. Check returns its problems, or none. */
export interface PendingReputationCheckpointRule {
  check(item: PendingReputationCheckpoint): string[];
}

export class PendingReputationCheckpointAttemptsRangeRule implements PendingReputationCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingReputationCheckpoint): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingReputationCheckpointImpressionsRangeRule implements PendingReputationCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingReputationCheckpoint): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingReputationCheckpointAllowedUtmSourceRule implements PendingReputationCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingReputationCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is below minimum`];
    return [];
  }
}

export class PendingReputationCheckpointCostRangeRule implements PendingReputationCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingReputationCheckpoint): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending reputation checkpoint. */
export class PendingReputationCheckpointValidator {
  rules: PendingReputationCheckpointRule[];

  constructor(rules: PendingReputationCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PendingReputationCheckpoint): string[] {
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

  requireValid(item: PendingReputationCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingReputationCheckpoint[]): Map<string, string[]> {
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

export function defaultPendingReputationCheckpointValidator(): PendingReputationCheckpointValidator {
  return new PendingReputationCheckpointValidator(
    [
      new PendingReputationCheckpointAttemptsRangeRule(16, 255),
      new PendingReputationCheckpointImpressionsRangeRule(64, 255),
      new PendingReputationCheckpointAllowedUtmSourceRule(["regional", "rolling"]),
      new PendingReputationCheckpointCostRangeRule(10, 2641.2),
    ],
  );
}
