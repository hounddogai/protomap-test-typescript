import { ManualRewardRuleAgreement } from "./manual-reward-rule-agreement.js";

/** A rule a manual reward rule agreement must pass. Check returns its problems, or none. */
export interface ManualRewardRuleAgreementRule {
  check(item: ManualRewardRuleAgreement): string[];
}

export class ManualRewardRuleAgreementTitleLengthRule implements ManualRewardRuleAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRewardRuleAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRewardRuleAgreementCodeLengthRule implements ManualRewardRuleAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRewardRuleAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRewardRuleAgreementRequiredTitleRule implements ManualRewardRuleAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRewardRuleAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual reward rule agreement. */
export class ManualRewardRuleAgreementValidator {
  rules: ManualRewardRuleAgreementRule[];

  constructor(rules: ManualRewardRuleAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRewardRuleAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualRewardRuleAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRewardRuleAgreement[]): Map<string, string[]> {
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

export function defaultManualRewardRuleAgreementValidator(): ManualRewardRuleAgreementValidator {
  return new ManualRewardRuleAgreementValidator(
    [
      new ManualRewardRuleAgreementTitleLengthRule(3600),
      new ManualRewardRuleAgreementCodeLengthRule(255),
      new ManualRewardRuleAgreementRequiredTitleRule("manual reward rule agreement needs an entry"),
    ],
  );
}
