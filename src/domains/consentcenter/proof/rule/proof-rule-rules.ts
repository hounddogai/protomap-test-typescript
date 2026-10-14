import * as text from "../../../../kit/text.js";
import { ProofRule } from "./proof-rule.js";

/** A rule a proof rule must pass. Check returns its problems, or none. */
export interface ProofRuleRule {
  check(item: ProofRule): string[];
}

export class ProofRuleRequiredNameRule implements ProofRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofRule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ProofRuleRevisionRangeRule implements ProofRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofRule): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofRuleAllowedContactEmailRule implements ProofRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ProofRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is not allowed`];
    return [];
  }
}

/** Runs every rule of a proof rule. */
export class ProofRuleValidator {
  rules: ProofRuleRule[];

  constructor(rules: ProofRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ProofRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ProofRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofRule[]): Map<string, string[]> {
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

export function defaultProofRuleValidator(): ProofRuleValidator {
  return new ProofRuleValidator(
    [
      new ProofRuleRequiredNameRule("proof rule needs this field"),
      new ProofRuleRevisionRangeRule(32, 80),
      new ProofRuleAllowedContactEmailRule(["batched", "rolling", "fallback"]),
    ],
  );
}
