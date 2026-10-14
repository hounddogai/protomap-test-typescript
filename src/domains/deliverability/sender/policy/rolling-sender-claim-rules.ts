import * as text from "../../../../kit/text.js";
import { RollingSenderClaim } from "./rolling-sender-claim.js";

/** A rule a rolling sender claim must pass. Check returns its problems, or none. */
export interface RollingSenderClaimRule {
  check(item: RollingSenderClaim): string[];
}

export class RollingSenderClaimRequiredTitleRule implements RollingSenderClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSenderClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSenderClaimCreatedAtRangeRule implements RollingSenderClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSenderClaim): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingSenderClaimAllowedCodeRule implements RollingSenderClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingSenderClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

/** Runs every rule of a rolling sender claim. */
export class RollingSenderClaimValidator {
  rules: RollingSenderClaimRule[];

  constructor(rules: RollingSenderClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSenderClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingSenderClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSenderClaim[]): Map<string, string[]> {
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

export function defaultRollingSenderClaimValidator(): RollingSenderClaimValidator {
  return new RollingSenderClaimValidator(
    [
      new RollingSenderClaimRequiredTitleRule("rolling sender claim needs a value"),
      new RollingSenderClaimCreatedAtRangeRule(120, 1000),
      new RollingSenderClaimAllowedCodeRule(["default", "default"]),
    ],
  );
}
