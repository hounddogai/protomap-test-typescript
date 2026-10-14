import { RedemptionPlan } from "./redemption-plan.js";

/** A rule a redemption plan must pass. Check returns its problems, or none. */
export interface RedemptionPlanRule {
  check(item: RedemptionPlan): string[];
}

export class RedemptionPlanRequiredCodeRule implements RedemptionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionPlanNotesLengthRule implements RedemptionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionPlan): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionPlanRequiredNotesRule implements RedemptionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionPlan): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionPlanRequiredNameRule implements RedemptionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionPlanUtmSourceLengthRule implements RedemptionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionPlan): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption plan. */
export class RedemptionPlanValidator {
  rules: RedemptionPlanRule[];

  constructor(rules: RedemptionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionPlan): string[] {
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

  requireValid(item: RedemptionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionPlan[]): Map<string, string[]> {
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

export function defaultRedemptionPlanValidator(): RedemptionPlanValidator {
  return new RedemptionPlanValidator(
    [
      new RedemptionPlanRequiredCodeRule("redemption plan needs this field"),
      new RedemptionPlanNotesLengthRule(16),
      new RedemptionPlanRequiredNotesRule("redemption plan needs this field"),
      new RedemptionPlanRequiredNameRule("redemption plan needs this field"),
      new RedemptionPlanUtmSourceLengthRule(16),
    ],
  );
}
