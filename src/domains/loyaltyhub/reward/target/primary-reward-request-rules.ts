import * as text from "../../../../kit/text.js";
import { PrimaryRewardRequest } from "./primary-reward-request.js";

/** A rule a primary reward request must pass. Check returns its problems, or none. */
export interface PrimaryRewardRequestRule {
  check(item: PrimaryRewardRequest): string[];
}

export class PrimaryRewardRequestNameLengthRule implements PrimaryRewardRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryRewardRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryRewardRequestRequiredCodeRule implements PrimaryRewardRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRewardRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryRewardRequestAllowedVariantRule implements PrimaryRewardRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryRewardRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is inconsistent`];
    return [];
  }
}

export class PrimaryRewardRequestVariantLengthRule implements PrimaryRewardRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryRewardRequest): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryRewardRequestRequiredNameRule implements PrimaryRewardRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRewardRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary reward request. */
export class PrimaryRewardRequestValidator {
  rules: PrimaryRewardRequestRule[];

  constructor(rules: PrimaryRewardRequestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryRewardRequest): string[] {
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

  requireValid(item: PrimaryRewardRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryRewardRequest[]): Map<string, string[]> {
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

export function defaultPrimaryRewardRequestValidator(): PrimaryRewardRequestValidator {
  return new PrimaryRewardRequestValidator(
    [
      new PrimaryRewardRequestNameLengthRule(3600),
      new PrimaryRewardRequestRequiredCodeRule("primary reward request needs a value"),
      new PrimaryRewardRequestAllowedVariantRule(["lenient"]),
      new PrimaryRewardRequestVariantLengthRule(16),
      new PrimaryRewardRequestRequiredNameRule("primary reward request needs a value"),
    ],
  );
}
