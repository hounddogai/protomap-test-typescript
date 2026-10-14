import * as text from "../../../../kit/text.js";
import { LevelPolicy } from "./level-policy.js";

/** A rule a level policy must pass. Check returns its problems, or none. */
export interface LevelPolicyRule {
  check(item: LevelPolicy): string[];
}

export class LevelPolicyTimezoneLengthRule implements LevelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelPolicy): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelPolicyAllowedCodeRule implements LevelPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LevelPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class LevelPolicyNameLengthRule implements LevelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelPolicyRequiredExternalRefRule implements LevelPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelPolicy): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class LevelPolicyExternalRefLengthRule implements LevelPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelPolicy): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelPolicyLimitRangeRule implements LevelPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelPolicy): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a level policy. */
export class LevelPolicyValidator {
  rules: LevelPolicyRule[];

  constructor(rules: LevelPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: LevelPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelPolicy[]): Map<string, string[]> {
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

export function defaultLevelPolicyValidator(): LevelPolicyValidator {
  return new LevelPolicyValidator(
    [
      new LevelPolicyTimezoneLengthRule(120),
      new LevelPolicyAllowedCodeRule(["batched", "seasonal"]),
      new LevelPolicyNameLengthRule(120),
      new LevelPolicyRequiredExternalRefRule("level policy needs a value"),
      new LevelPolicyExternalRefLengthRule(255),
      new LevelPolicyLimitRangeRule(32, 80),
    ],
  );
}
