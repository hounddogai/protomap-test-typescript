import { ManualFraudCheckPlan } from "./manual-fraud-check-plan.js";

/** A rule a manual fraud check plan must pass. Check returns its problems, or none. */
export interface ManualFraudCheckPlanRule {
  check(item: ManualFraudCheckPlan): string[];
}

export class ManualFraudCheckPlanFloorValueRangeRule implements ManualFraudCheckPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFraudCheckPlan): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualFraudCheckPlanTagsLimitRule implements ManualFraudCheckPlanRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ManualFraudCheckPlan): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ManualFraudCheckPlanRequiredCodeRule implements ManualFraudCheckPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFraudCheckPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFraudCheckPlanStartsAtRangeRule implements ManualFraudCheckPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFraudCheckPlan): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualFraudCheckPlanCodeLengthRule implements ManualFraudCheckPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualFraudCheckPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual fraud check plan. */
export class ManualFraudCheckPlanValidator {
  rules: ManualFraudCheckPlanRule[];

  constructor(rules: ManualFraudCheckPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFraudCheckPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualFraudCheckPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFraudCheckPlan[]): Map<string, string[]> {
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

export function defaultManualFraudCheckPlanValidator(): ManualFraudCheckPlanValidator {
  return new ManualFraudCheckPlanValidator(
    [
      new ManualFraudCheckPlanFloorValueRangeRule(4.7, 553.6),
      new ManualFraudCheckPlanTagsLimitRule(32, ["default", "default"]),
      new ManualFraudCheckPlanRequiredCodeRule("manual fraud check plan needs a value"),
      new ManualFraudCheckPlanStartsAtRangeRule(16, 120),
      new ManualFraudCheckPlanCodeLengthRule(120),
    ],
  );
}
