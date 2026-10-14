import { PlacementRule } from "./placement-rule.js";

/** A rule a placement rule must pass. Check returns its problems, or none. */
export interface PlacementRuleRule {
  check(item: PlacementRule): string[];
}

export class PlacementRuleCodeLengthRule implements PlacementRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementRuleCodePrefixRule implements PlacementRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PlacementRuleMarginRangeRule implements PlacementRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementRule): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementRuleOwnerIdLengthRule implements PlacementRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementRule): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementRuleLabelLengthRule implements PlacementRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementRule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a placement rule. */
export class PlacementRuleValidator {
  rules: PlacementRuleRule[];

  constructor(rules: PlacementRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementRule[]): Map<string, string[]> {
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

export function defaultPlacementRuleValidator(): PlacementRuleValidator {
  return new PlacementRuleValidator(
    [
      new PlacementRuleCodeLengthRule(16),
      new PlacementRuleCodePrefixRule("ACM"),
      new PlacementRuleMarginRangeRule(1.7, 1693.2),
      new PlacementRuleOwnerIdLengthRule(120),
      new PlacementRuleLabelLengthRule(255),
    ],
  );
}
