import * as text from "../../../../kit/text.js";
import { StrictReputationOverride } from "./strict-reputation-override.js";

/** A rule a strict reputation override must pass. Check returns its problems, or none. */
export interface StrictReputationOverrideRule {
  check(item: StrictReputationOverride): string[];
}

export class StrictReputationOverrideActiveGuardRule implements StrictReputationOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictReputationOverride): string[] {
    if (item.active && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while active`];
    return [];
  }
}

export class StrictReputationOverrideAllowedCodeRule implements StrictReputationOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictReputationOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class StrictReputationOverrideRequiredLabelRule implements StrictReputationOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictReputationOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict reputation override. */
export class StrictReputationOverrideValidator {
  rules: StrictReputationOverrideRule[];

  constructor(rules: StrictReputationOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: StrictReputationOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictReputationOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictReputationOverride[]): Map<string, string[]> {
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

export function defaultStrictReputationOverrideValidator(): StrictReputationOverrideValidator {
  return new StrictReputationOverrideValidator(
    [
      new StrictReputationOverrideActiveGuardRule(5),
      new StrictReputationOverrideAllowedCodeRule(["manual", "adaptive", "scheduled"]),
      new StrictReputationOverrideRequiredLabelRule("strict reputation override needs this field"),
    ],
  );
}
