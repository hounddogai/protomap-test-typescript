import { RewardRuleSlot } from "./reward-rule-slot.js";

/** A rule a reward rule slot must pass. Check returns its problems, or none. */
export interface RewardRuleSlotRule {
  check(item: RewardRuleSlot): string[];
}

export class RewardRuleSlotRequiredContactEmailRule implements RewardRuleSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleSlot): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleSlotBatchSizeRangeRule implements RewardRuleSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleSlot): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleSlotLabelLengthRule implements RewardRuleSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rule slot. */
export class RewardRuleSlotValidator {
  rules: RewardRuleSlotRule[];

  constructor(rules: RewardRuleSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleSlot): string[] {
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

  requireValid(item: RewardRuleSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleSlot[]): Map<string, string[]> {
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

export function defaultRewardRuleSlotValidator(): RewardRuleSlotValidator {
  return new RewardRuleSlotValidator(
    [
      new RewardRuleSlotRequiredContactEmailRule("reward rule slot needs a value"),
      new RewardRuleSlotBatchSizeRangeRule(16, 86400),
      new RewardRuleSlotLabelLengthRule(64),
    ],
  );
}
