import * as text from "../../../../kit/text.js";
import { GlobalPostRequest } from "./global-post-request.js";

/** A rule a global post request must pass. Check returns its problems, or none. */
export interface GlobalPostRequestRule {
  check(item: GlobalPostRequest): string[];
}

export class GlobalPostRequestAllowedCategoryRule implements GlobalPostRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalPostRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is too long`];
    return [];
  }
}

export class GlobalPostRequestRequiredLabelRule implements GlobalPostRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPostRequest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPostRequestRequiredNotesRule implements GlobalPostRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPostRequest): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPostRequestRequiredCodeRule implements GlobalPostRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPostRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global post request. */
export class GlobalPostRequestValidator {
  rules: GlobalPostRequestRule[];

  constructor(rules: GlobalPostRequestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPostRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalPostRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPostRequest[]): Map<string, string[]> {
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

export function defaultGlobalPostRequestValidator(): GlobalPostRequestValidator {
  return new GlobalPostRequestValidator(
    [
      new GlobalPostRequestAllowedCategoryRule(["global", "regional"]),
      new GlobalPostRequestRequiredLabelRule("global post request needs this field"),
      new GlobalPostRequestRequiredNotesRule("global post request needs this field"),
      new GlobalPostRequestRequiredCodeRule("global post request needs this field"),
    ],
  );
}
