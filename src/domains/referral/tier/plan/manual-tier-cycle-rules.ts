import * as text from "../../../../kit/text.js";
import { ManualTierCycle } from "./manual-tier-cycle.js";

/** A rule a manual tier cycle must pass. Check returns its problems, or none. */
export interface ManualTierCycleRule {
  check(item: ManualTierCycle): string[];
}

export class ManualTierCycleCodeLengthRule implements ManualTierCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualTierCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualTierCycleRequiredCodeRule implements ManualTierCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTierCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTierCycleAllowedNameRule implements ManualTierCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualTierCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

/** Runs every rule of a manual tier cycle. */
export class ManualTierCycleValidator {
  rules: ManualTierCycleRule[];

  constructor(rules: ManualTierCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTierCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTierCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTierCycle[]): Map<string, string[]> {
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

export function defaultManualTierCycleValidator(): ManualTierCycleValidator {
  return new ManualTierCycleValidator(
    [
      new ManualTierCycleCodeLengthRule(80),
      new ManualTierCycleRequiredCodeRule("manual tier cycle needs this field"),
      new ManualTierCycleAllowedNameRule(["pending", "manual"]),
    ],
  );
}
