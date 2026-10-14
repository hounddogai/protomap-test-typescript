import * as text from "../../../../kit/text.js";
import { SlaRequest } from "./sla-request.js";

/** A rule a sla request must pass. Check returns its problems, or none. */
export interface SlaRequestRule {
  check(item: SlaRequest): string[];
}

export class SlaRequestRequiredCurrencyRule implements SlaRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaRequest): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class SlaRequestExternalRefLengthRule implements SlaRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaRequest): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaRequestAllowedTimezoneRule implements SlaRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is unknown`];
    return [];
  }
}

export class SlaRequestCodePrefixRule implements SlaRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a sla request. */
export class SlaRequestValidator {
  rules: SlaRequestRule[];

  constructor(rules: SlaRequestRule[]) {
    this.rules = rules;
  }

  validate(item: SlaRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaRequest[]): Map<string, string[]> {
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

export function defaultSlaRequestValidator(): SlaRequestValidator {
  return new SlaRequestValidator(
    [
      new SlaRequestRequiredCurrencyRule("sla request needs this field"),
      new SlaRequestExternalRefLengthRule(3600),
      new SlaRequestAllowedTimezoneRule([]),
      new SlaRequestCodePrefixRule("Q"),
    ],
  );
}
