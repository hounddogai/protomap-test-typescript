import { RewardRuleAdjustment } from "./reward-rule-adjustment.js";

/** A rule a reward rule adjustment must pass. Check returns its problems, or none. */
export interface RewardRuleAdjustmentRule {
  check(item: RewardRuleAdjustment): string[];
}

export class RewardRuleAdjustmentNotesLengthRule implements RewardRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleAdjustment): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleAdjustmentRequiredNotesRule implements RewardRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleAdjustment): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleAdjustmentLabelLengthRule implements RewardRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleAdjustment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleAdjustmentRequiredLabelRule implements RewardRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleAdjustmentCodeLengthRule implements RewardRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleAdjustment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rule adjustment. */
export class RewardRuleAdjustmentValidator {
  rules: RewardRuleAdjustmentRule[];

  constructor(rules: RewardRuleAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleAdjustment[]): Map<string, string[]> {
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

export function defaultRewardRuleAdjustmentValidator(): RewardRuleAdjustmentValidator {
  return new RewardRuleAdjustmentValidator(
    [
      new RewardRuleAdjustmentNotesLengthRule(80),
      new RewardRuleAdjustmentRequiredNotesRule("reward rule adjustment needs this field"),
      new RewardRuleAdjustmentLabelLengthRule(64),
      new RewardRuleAdjustmentRequiredLabelRule("reward rule adjustment needs an entry"),
      new RewardRuleAdjustmentCodeLengthRule(3600),
    ],
  );
}
