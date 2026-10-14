import * as text from "../../../../kit/text.js";
import { ActivationRequest } from "./activation-request.js";

/** A rule a activation request must pass. Check returns its problems, or none. */
export interface ActivationRequestRule {
  check(item: ActivationRequest): string[];
}

export class ActivationRequestExpiresAtRangeRule implements ActivationRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationRequest): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationRequestRevisionRangeRule implements ActivationRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationRequest): string[] {
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

export class ActivationRequestContactEmailLengthRule implements ActivationRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationRequest): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationRequestCodePrefixRule implements ActivationRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationRequestAllowedVariantRule implements ActivationRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is stale`];
    return [];
  }
}

export class ActivationRequestExternalRefLengthRule implements ActivationRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationRequest): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation request. */
export class ActivationRequestValidator {
  rules: ActivationRequestRule[];

  constructor(rules: ActivationRequestRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationRequest): string[] {
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

  requireValid(item: ActivationRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationRequest[]): Map<string, string[]> {
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

export function defaultActivationRequestValidator(): ActivationRequestValidator {
  return new ActivationRequestValidator(
    [
      new ActivationRequestExpiresAtRangeRule(64, 1000),
      new ActivationRequestRevisionRangeRule(120, 1000),
      new ActivationRequestContactEmailLengthRule(1000),
      new ActivationRequestCodePrefixRule("REF"),
      new ActivationRequestAllowedVariantRule(["rolling", "regional"]),
      new ActivationRequestExternalRefLengthRule(32),
    ],
  );
}
