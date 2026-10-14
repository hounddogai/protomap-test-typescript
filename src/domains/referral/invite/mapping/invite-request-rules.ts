import * as text from "../../../../kit/text.js";
import { InviteRequest } from "./invite-request.js";

/** A rule a invite request must pass. Check returns its problems, or none. */
export interface InviteRequestRule {
  check(item: InviteRequest): string[];
}

export class InviteRequestRequiredTitleRule implements InviteRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteRequest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class InviteRequestAllowedExternalRefRule implements InviteRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is unknown`];
    return [];
  }
}

export class InviteRequestRequiredCodeRule implements InviteRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a invite request. */
export class InviteRequestValidator {
  rules: InviteRequestRule[];

  constructor(rules: InviteRequestRule[]) {
    this.rules = rules;
  }

  validate(item: InviteRequest): string[] {
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

  requireValid(item: InviteRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteRequest[]): Map<string, string[]> {
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

export function defaultInviteRequestValidator(): InviteRequestValidator {
  return new InviteRequestValidator(
    [
      new InviteRequestRequiredTitleRule("invite request needs a value"),
      new InviteRequestAllowedExternalRefRule([]),
      new InviteRequestRequiredCodeRule("invite request needs a value"),
    ],
  );
}
