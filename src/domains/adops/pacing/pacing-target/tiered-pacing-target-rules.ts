import * as text from "../../../../kit/text.js";
import { TieredPacingTarget } from "./tiered-pacing-target.js";

/** A rule a tiered pacing target must pass. Check returns its problems, or none. */
export interface TieredPacingTargetRule {
  check(item: TieredPacingTarget): string[];
}

export class TieredPacingTargetRequiredChannelRule implements TieredPacingTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredPacingTarget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TieredPacingTargetCodeLengthRule implements TieredPacingTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredPacingTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredPacingTargetAllowedChannelRule implements TieredPacingTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredPacingTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is unknown`];
    return [];
  }
}

/** Runs every rule of a tiered pacing target. */
export class TieredPacingTargetValidator {
  rules: TieredPacingTargetRule[];

  constructor(rules: TieredPacingTargetRule[]) {
    this.rules = rules;
  }

  validate(item: TieredPacingTarget): string[] {
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

  requireValid(item: TieredPacingTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredPacingTarget[]): Map<string, string[]> {
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

export function defaultTieredPacingTargetValidator(): TieredPacingTargetValidator {
  return new TieredPacingTargetValidator(
    [
      new TieredPacingTargetRequiredChannelRule("tiered pacing target needs a value"),
      new TieredPacingTargetCodeLengthRule(32),
      new TieredPacingTargetAllowedChannelRule(["batched", "capped", "manual"]),
    ],
  );
}
