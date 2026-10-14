import * as text from "../../../../kit/text.js";
import { FallbackDomainPolicy } from "./fallback-domain-policy.js";

/** A rule a fallback domain policy must pass. Check returns its problems, or none. */
export interface FallbackDomainPolicyRule {
  check(item: FallbackDomainPolicy): string[];
}

export class FallbackDomainPolicyCodePrefixRule implements FallbackDomainPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackDomainPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackDomainPolicyRequiredCodeRule implements FallbackDomainPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackDomainPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackDomainPolicyRequiredNameRule implements FallbackDomainPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackDomainPolicy): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackDomainPolicyCodeLengthRule implements FallbackDomainPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackDomainPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackDomainPolicyRequiredChecksumRule implements FallbackDomainPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackDomainPolicy): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackDomainPolicyAllowedNameRule implements FallbackDomainPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackDomainPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

/** Runs every rule of a fallback domain policy. */
export class FallbackDomainPolicyValidator {
  rules: FallbackDomainPolicyRule[];

  constructor(rules: FallbackDomainPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackDomainPolicy): string[] {
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

  requireValid(item: FallbackDomainPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackDomainPolicy[]): Map<string, string[]> {
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

export function defaultFallbackDomainPolicyValidator(): FallbackDomainPolicyValidator {
  return new FallbackDomainPolicyValidator(
    [
      new FallbackDomainPolicyCodePrefixRule("ACM"),
      new FallbackDomainPolicyRequiredCodeRule("fallback domain policy needs this field"),
      new FallbackDomainPolicyRequiredNameRule("fallback domain policy needs this field"),
      new FallbackDomainPolicyCodeLengthRule(86400),
      new FallbackDomainPolicyRequiredChecksumRule("fallback domain policy needs this field"),
      new FallbackDomainPolicyAllowedNameRule(["pending", "seasonal"]),
    ],
  );
}
