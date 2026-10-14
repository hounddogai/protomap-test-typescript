import { RollingLevelPolicy } from "./rolling-level-policy.js";

/** A rule a rolling level policy must pass. Check returns its problems, or none. */
export interface RollingLevelPolicyRule {
  check(item: RollingLevelPolicy): string[];
}

export class RollingLevelPolicyRequiredDescriptionRule implements RollingLevelPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLevelPolicy): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class RollingLevelPolicyRequiredNameRule implements RollingLevelPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLevelPolicy): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingLevelPolicyFloorValueRangeRule implements RollingLevelPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingLevelPolicy): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingLevelPolicyRequiredCodeRule implements RollingLevelPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLevelPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingLevelPolicyCodePrefixRule implements RollingLevelPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingLevelPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingLevelPolicyImpressionsRangeRule implements RollingLevelPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingLevelPolicy): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling level policy. */
export class RollingLevelPolicyValidator {
  rules: RollingLevelPolicyRule[];

  constructor(rules: RollingLevelPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RollingLevelPolicy): string[] {
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

  requireValid(item: RollingLevelPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingLevelPolicy[]): Map<string, string[]> {
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

export function defaultRollingLevelPolicyValidator(): RollingLevelPolicyValidator {
  return new RollingLevelPolicyValidator(
    [
      new RollingLevelPolicyRequiredDescriptionRule("rolling level policy needs this field"),
      new RollingLevelPolicyRequiredNameRule("rolling level policy needs a value"),
      new RollingLevelPolicyFloorValueRangeRule(8.3, 1426),
      new RollingLevelPolicyRequiredCodeRule("rolling level policy needs an entry"),
      new RollingLevelPolicyCodePrefixRule("Q"),
      new RollingLevelPolicyImpressionsRangeRule(32, 64),
    ],
  );
}
