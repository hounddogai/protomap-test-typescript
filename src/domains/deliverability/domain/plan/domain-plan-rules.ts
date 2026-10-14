import * as text from "../../../../kit/text.js";
import { DomainPlan } from "./domain-plan.js";

/** A rule a domain plan must pass. Check returns its problems, or none. */
export interface DomainPlanRule {
  check(item: DomainPlan): string[];
}

export class DomainPlanRequiredSourceRule implements DomainPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainPlan): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class DomainPlanRequiredTitleRule implements DomainPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainPlan): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DomainPlanPriorityRangeRule implements DomainPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainPlan): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DomainPlanCodePrefixRule implements DomainPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DomainPlanAllowedCodeRule implements DomainPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a domain plan. */
export class DomainPlanValidator {
  rules: DomainPlanRule[];

  constructor(rules: DomainPlanRule[]) {
    this.rules = rules;
  }

  validate(item: DomainPlan): string[] {
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

  requireValid(item: DomainPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainPlan[]): Map<string, string[]> {
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

export function defaultDomainPlanValidator(): DomainPlanValidator {
  return new DomainPlanValidator(
    [
      new DomainPlanRequiredSourceRule("domain plan needs an entry"),
      new DomainPlanRequiredTitleRule("domain plan needs an entry"),
      new DomainPlanPriorityRangeRule(80, 255),
      new DomainPlanCodePrefixRule("ACM"),
      new DomainPlanAllowedCodeRule([]),
    ],
  );
}
