import * as text from "../../../../kit/text.js";
import { WarmupPlan } from "./warmup-plan.js";

/** A rule a warmup plan must pass. Check returns its problems, or none. */
export interface WarmupPlanRule {
  check(item: WarmupPlan): string[];
}

export class WarmupPlanAllowedChannelRule implements WarmupPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is too long`];
    return [];
  }
}

export class WarmupPlanNameLengthRule implements WarmupPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupPlanCodePrefixRule implements WarmupPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupPlanRequiredCodeRule implements WarmupPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupPlanCodeLengthRule implements WarmupPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupPlanCohortLengthRule implements WarmupPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupPlan): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a warmup plan. */
export class WarmupPlanValidator {
  rules: WarmupPlanRule[];

  constructor(rules: WarmupPlanRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupPlan[]): Map<string, string[]> {
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

export function defaultWarmupPlanValidator(): WarmupPlanValidator {
  return new WarmupPlanValidator(
    [
      new WarmupPlanAllowedChannelRule(["rolling", "weighted"]),
      new WarmupPlanNameLengthRule(86400),
      new WarmupPlanCodePrefixRule("ACM"),
      new WarmupPlanRequiredCodeRule("warmup plan needs a value"),
      new WarmupPlanCodeLengthRule(120),
      new WarmupPlanCohortLengthRule(16),
    ],
  );
}
