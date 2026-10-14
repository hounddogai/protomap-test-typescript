import * as text from "../../../../kit/text.js";
import { GlobalRewardTarget } from "./global-reward-target.js";

/** A rule a global reward target must pass. Check returns its problems, or none. */
export interface GlobalRewardTargetRule {
  check(item: GlobalRewardTarget): string[];
}

export class GlobalRewardTargetRequiredCodeRule implements GlobalRewardTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardTargetCodePrefixRule implements GlobalRewardTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalRewardTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalRewardTargetCreatedAtRangeRule implements GlobalRewardTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardTarget): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalRewardTargetRequiredCampaignRefRule implements GlobalRewardTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardTarget): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardTargetAllowedNameRule implements GlobalRewardTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalRewardTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class GlobalRewardTargetRequiredNameRule implements GlobalRewardTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global reward target. */
export class GlobalRewardTargetValidator {
  rules: GlobalRewardTargetRule[];

  constructor(rules: GlobalRewardTargetRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRewardTarget): string[] {
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

  requireValid(item: GlobalRewardTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRewardTarget[]): Map<string, string[]> {
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

export function defaultGlobalRewardTargetValidator(): GlobalRewardTargetValidator {
  return new GlobalRewardTargetValidator(
    [
      new GlobalRewardTargetRequiredCodeRule("global reward target needs an entry"),
      new GlobalRewardTargetCodePrefixRule("Q"),
      new GlobalRewardTargetCreatedAtRangeRule(80, 255),
      new GlobalRewardTargetRequiredCampaignRefRule("global reward target needs a value"),
      new GlobalRewardTargetAllowedNameRule(["lenient"]),
      new GlobalRewardTargetRequiredNameRule("global reward target needs this field"),
    ],
  );
}
