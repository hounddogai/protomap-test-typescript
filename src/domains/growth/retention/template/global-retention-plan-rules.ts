import { GlobalRetentionPlan } from "./global-retention-plan.js";

/** A rule a global retention plan must pass. Check returns its problems, or none. */
export interface GlobalRetentionPlanRule {
  check(item: GlobalRetentionPlan): string[];
}

export class GlobalRetentionPlanRequiredNameRule implements GlobalRetentionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRetentionPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRetentionPlanChannelLengthRule implements GlobalRetentionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRetentionPlan): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRetentionPlanSendAtRangeRule implements GlobalRetentionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRetentionPlan): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global retention plan. */
export class GlobalRetentionPlanValidator {
  rules: GlobalRetentionPlanRule[];

  constructor(rules: GlobalRetentionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRetentionPlan): string[] {
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

  requireValid(item: GlobalRetentionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRetentionPlan[]): Map<string, string[]> {
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

export function defaultGlobalRetentionPlanValidator(): GlobalRetentionPlanValidator {
  return new GlobalRetentionPlanValidator(
    [
      new GlobalRetentionPlanRequiredNameRule("global retention plan needs an entry"),
      new GlobalRetentionPlanChannelLengthRule(1000),
      new GlobalRetentionPlanSendAtRangeRule(64, 3600),
    ],
  );
}
