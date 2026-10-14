import * as text from "../../../../kit/text.js";
import { TierThreshold } from "./tier-threshold.js";

/** A rule a tier threshold must pass. Check returns its problems, or none. */
export interface TierThresholdRule {
  check(item: TierThreshold): string[];
}

export class TierThresholdAllowedDescriptionRule implements TierThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is duplicated`];
    return [];
  }
}

export class TierThresholdRequiredChannelRule implements TierThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierThreshold): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TierThresholdChannelLengthRule implements TierThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierThreshold): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tier threshold. */
export class TierThresholdValidator {
  rules: TierThresholdRule[];

  constructor(rules: TierThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: TierThreshold): string[] {
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

  requireValid(item: TierThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierThreshold[]): Map<string, string[]> {
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

export function defaultTierThresholdValidator(): TierThresholdValidator {
  return new TierThresholdValidator(
    [
      new TierThresholdAllowedDescriptionRule(["pending"]),
      new TierThresholdRequiredChannelRule("tier threshold needs a value"),
      new TierThresholdChannelLengthRule(64),
    ],
  );
}
