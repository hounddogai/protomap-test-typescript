import { FallbackLevelPolicy } from "./fallback-level-policy.js";

/** A rule a fallback level policy must pass. Check returns its problems, or none. */
export interface FallbackLevelPolicyRule {
  check(item: FallbackLevelPolicy): string[];
}

export class FallbackLevelPolicyCapacityRangeRule implements FallbackLevelPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackLevelPolicy): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackLevelPolicyFloorValueRangeRule implements FallbackLevelPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackLevelPolicy): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackLevelPolicyTitleLengthRule implements FallbackLevelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackLevelPolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackLevelPolicyRequiredExternalRefRule implements FallbackLevelPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackLevelPolicy): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackLevelPolicyExternalRefLengthRule implements FallbackLevelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackLevelPolicy): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback level policy. */
export class FallbackLevelPolicyValidator {
  rules: FallbackLevelPolicyRule[];

  constructor(rules: FallbackLevelPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackLevelPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackLevelPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackLevelPolicy[]): Map<string, string[]> {
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

export function defaultFallbackLevelPolicyValidator(): FallbackLevelPolicyValidator {
  return new FallbackLevelPolicyValidator(
    [
      new FallbackLevelPolicyCapacityRangeRule(80, 86400),
      new FallbackLevelPolicyFloorValueRangeRule(2.4, 2547.2),
      new FallbackLevelPolicyTitleLengthRule(64),
      new FallbackLevelPolicyRequiredExternalRefRule("fallback level policy needs this field"),
      new FallbackLevelPolicyExternalRefLengthRule(255),
    ],
  );
}
