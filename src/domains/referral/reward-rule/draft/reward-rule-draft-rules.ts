import * as text from "../../../../kit/text.js";
import { RewardRuleDraft } from "./reward-rule-draft.js";

/** A rule a reward rule draft must pass. Check returns its problems, or none. */
export interface RewardRuleDraftRule {
  check(item: RewardRuleDraft): string[];
}

export class RewardRuleDraftCodeLengthRule implements RewardRuleDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleDraftRequiredVariantRule implements RewardRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleDraft): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleDraftRequiredExternalRefRule implements RewardRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleDraft): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleDraftVersionRangeRule implements RewardRuleDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleDraft): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleDraftAllowedNameRule implements RewardRuleDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

/** Runs every rule of a reward rule draft. */
export class RewardRuleDraftValidator {
  rules: RewardRuleDraftRule[];

  constructor(rules: RewardRuleDraftRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleDraft): string[] {
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

  requireValid(item: RewardRuleDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleDraft[]): Map<string, string[]> {
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

export function defaultRewardRuleDraftValidator(): RewardRuleDraftValidator {
  return new RewardRuleDraftValidator(
    [
      new RewardRuleDraftCodeLengthRule(3600),
      new RewardRuleDraftRequiredVariantRule("reward rule draft needs this field"),
      new RewardRuleDraftRequiredExternalRefRule("reward rule draft needs a value"),
      new RewardRuleDraftVersionRangeRule(120, 86400),
      new RewardRuleDraftAllowedNameRule(["tiered", "primary", "scheduled"]),
    ],
  );
}
