import { RewardRollup } from "./reward-rollup.js";

/** A rule a reward rollup must pass. Check returns its problems, or none. */
export interface RewardRollupRule {
  check(item: RewardRollup): string[];
}

export class RewardRollupJourneyIdLengthRule implements RewardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRollup): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRollupRequiredNameRule implements RewardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRollupRequiredJourneyIdRule implements RewardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRollup): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRollupNameLengthRule implements RewardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRollupCodeLengthRule implements RewardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rollup. */
export class RewardRollupValidator {
  rules: RewardRollupRule[];

  constructor(rules: RewardRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRollup[]): Map<string, string[]> {
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

export function defaultRewardRollupValidator(): RewardRollupValidator {
  return new RewardRollupValidator(
    [
      new RewardRollupJourneyIdLengthRule(3600),
      new RewardRollupRequiredNameRule("reward rollup needs this field"),
      new RewardRollupRequiredJourneyIdRule("reward rollup needs a value"),
      new RewardRollupNameLengthRule(255),
      new RewardRollupCodeLengthRule(86400),
    ],
  );
}
