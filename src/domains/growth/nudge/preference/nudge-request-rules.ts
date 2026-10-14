import * as text from "../../../../kit/text.js";
import { NudgeRequest } from "./nudge-request.js";

/** A rule a nudge request must pass. Check returns its problems, or none. */
export interface NudgeRequestRule {
  check(item: NudgeRequest): string[];
}

export class NudgeRequestRequiredNameRule implements NudgeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeRequestNameLengthRule implements NudgeRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeRequestCodePrefixRule implements NudgeRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeRequestRequiredCodeRule implements NudgeRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeRequestAllowedCurrencyRule implements NudgeRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.currency))) return [`currency ${item.currency} is duplicated`];
    return [];
  }
}

/** Runs every rule of a nudge request. */
export class NudgeRequestValidator {
  rules: NudgeRequestRule[];

  constructor(rules: NudgeRequestRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeRequest[]): Map<string, string[]> {
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

export function defaultNudgeRequestValidator(): NudgeRequestValidator {
  return new NudgeRequestValidator(
    [
      new NudgeRequestRequiredNameRule("nudge request needs an entry"),
      new NudgeRequestNameLengthRule(1000),
      new NudgeRequestCodePrefixRule("REF"),
      new NudgeRequestRequiredCodeRule("nudge request needs this field"),
      new NudgeRequestAllowedCurrencyRule(["rolling", "fallback"]),
    ],
  );
}
