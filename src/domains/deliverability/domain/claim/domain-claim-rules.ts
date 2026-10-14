import * as text from "../../../../kit/text.js";
import { DomainClaim } from "./domain-claim.js";

/** A rule a domain claim must pass. Check returns its problems, or none. */
export interface DomainClaimRule {
  check(item: DomainClaim): string[];
}

export class DomainClaimRequiredNameRule implements DomainClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DomainClaimRequiredChannelRule implements DomainClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainClaim): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class DomainClaimPhoneLengthRule implements DomainClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainClaim): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainClaimAllowedNameRule implements DomainClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class DomainClaimNameLengthRule implements DomainClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainClaim): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a domain claim. */
export class DomainClaimValidator {
  rules: DomainClaimRule[];

  constructor(rules: DomainClaimRule[]) {
    this.rules = rules;
  }

  validate(item: DomainClaim): string[] {
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

  requireValid(item: DomainClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainClaim[]): Map<string, string[]> {
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

export function defaultDomainClaimValidator(): DomainClaimValidator {
  return new DomainClaimValidator(
    [
      new DomainClaimRequiredNameRule("domain claim needs this field"),
      new DomainClaimRequiredChannelRule("domain claim needs a value"),
      new DomainClaimPhoneLengthRule(16),
      new DomainClaimAllowedNameRule(["pending", "adaptive", "batched"]),
      new DomainClaimNameLengthRule(120),
    ],
  );
}
