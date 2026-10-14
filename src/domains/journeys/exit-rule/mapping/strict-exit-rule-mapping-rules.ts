import { StrictExitRuleMapping } from "./strict-exit-rule-mapping.js";

/** A rule a strict exit rule mapping must pass. Check returns its problems, or none. */
export interface StrictExitRuleMappingRule {
  check(item: StrictExitRuleMapping): string[];
}

export class StrictExitRuleMappingRequiredUnitRule implements StrictExitRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictExitRuleMapping): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class StrictExitRuleMappingRequiredRegionRule implements StrictExitRuleMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictExitRuleMapping): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class StrictExitRuleMappingRegionLengthRule implements StrictExitRuleMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictExitRuleMapping): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict exit rule mapping. */
export class StrictExitRuleMappingValidator {
  rules: StrictExitRuleMappingRule[];

  constructor(rules: StrictExitRuleMappingRule[]) {
    this.rules = rules;
  }

  validate(item: StrictExitRuleMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictExitRuleMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictExitRuleMapping[]): Map<string, string[]> {
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

export function defaultStrictExitRuleMappingValidator(): StrictExitRuleMappingValidator {
  return new StrictExitRuleMappingValidator(
    [
      new StrictExitRuleMappingRequiredUnitRule("strict exit rule mapping needs this field"),
      new StrictExitRuleMappingRequiredRegionRule("strict exit rule mapping needs a value"),
      new StrictExitRuleMappingRegionLengthRule(255),
    ],
  );
}
