import * as text from "../../../../kit/text.js";
import { CappedTicketViewDigest } from "./capped-ticket-view-digest.js";

/** A rule a capped ticket view digest must pass. Check returns its problems, or none. */
export interface CappedTicketViewDigestRule {
  check(item: CappedTicketViewDigest): string[];
}

export class CappedTicketViewDigestTimezoneLengthRule implements CappedTicketViewDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTicketViewDigest): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedTicketViewDigestRequiredRegionRule implements CappedTicketViewDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTicketViewDigest): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTicketViewDigestRequiredCodeRule implements CappedTicketViewDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTicketViewDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTicketViewDigestCodeLengthRule implements CappedTicketViewDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedTicketViewDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedTicketViewDigestAllowedCodeRule implements CappedTicketViewDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedTicketViewDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a capped ticket view digest. */
export class CappedTicketViewDigestValidator {
  rules: CappedTicketViewDigestRule[];

  constructor(rules: CappedTicketViewDigestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTicketViewDigest): string[] {
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

  requireValid(item: CappedTicketViewDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTicketViewDigest[]): Map<string, string[]> {
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

export function defaultCappedTicketViewDigestValidator(): CappedTicketViewDigestValidator {
  return new CappedTicketViewDigestValidator(
    [
      new CappedTicketViewDigestTimezoneLengthRule(1000),
      new CappedTicketViewDigestRequiredRegionRule("capped ticket view digest needs an entry"),
      new CappedTicketViewDigestRequiredCodeRule("capped ticket view digest needs this field"),
      new CappedTicketViewDigestCodeLengthRule(3600),
      new CappedTicketViewDigestAllowedCodeRule(["scheduled", "manual", "batched"]),
    ],
  );
}
