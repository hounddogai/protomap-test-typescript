import { ManualRewardRuleDraft } from "./manual-reward-rule-draft.js";

/** A rule a manual reward rule draft must pass. Check returns its problems, or none. */
export interface ManualRewardRuleDraftRule {
  check(item: ManualRewardRuleDraft): string[];
}

export class ManualRewardRuleDraftChannelLengthRule implements ManualRewardRuleDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRewardRuleDraft): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRewardRuleDraftLocaleLengthRule implements ManualRewardRuleDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRewardRuleDraft): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRewardRuleDraftCodeLengthRule implements ManualRewardRuleDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRewardRuleDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual reward rule draft. */
export class ManualRewardRuleDraftValidator {
  rules: ManualRewardRuleDraftRule[];

  constructor(rules: ManualRewardRuleDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRewardRuleDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualRewardRuleDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRewardRuleDraft[]): Map<string, string[]> {
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

export function defaultManualRewardRuleDraftValidator(): ManualRewardRuleDraftValidator {
  return new ManualRewardRuleDraftValidator(
    [
      new ManualRewardRuleDraftChannelLengthRule(3600),
      new ManualRewardRuleDraftLocaleLengthRule(255),
      new ManualRewardRuleDraftCodeLengthRule(64),
    ],
  );
}
