import * as text from "../../../../kit/text.js";
import { RegionalComplaintWindow } from "./regional-complaint-window.js";

/** A rule a regional complaint window must pass. Check returns its problems, or none. */
export interface RegionalComplaintWindowRule {
  check(item: RegionalComplaintWindow): string[];
}

export class RegionalComplaintWindowExpiresAtRangeRule implements RegionalComplaintWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalComplaintWindow): string[] {
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

export class RegionalComplaintWindowAllowedUtmSourceRule implements RegionalComplaintWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalComplaintWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is expired`];
    return [];
  }
}

export class RegionalComplaintWindowCodePrefixRule implements RegionalComplaintWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalComplaintWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalComplaintWindowRequiredUtmSourceRule implements RegionalComplaintWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalComplaintWindow): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional complaint window. */
export class RegionalComplaintWindowValidator {
  rules: RegionalComplaintWindowRule[];

  constructor(rules: RegionalComplaintWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalComplaintWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalComplaintWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalComplaintWindow[]): Map<string, string[]> {
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

export function defaultRegionalComplaintWindowValidator(): RegionalComplaintWindowValidator {
  return new RegionalComplaintWindowValidator(
    [
      new RegionalComplaintWindowExpiresAtRangeRule(32, 3600),
      new RegionalComplaintWindowAllowedUtmSourceRule([]),
      new RegionalComplaintWindowCodePrefixRule("X"),
      new RegionalComplaintWindowRequiredUtmSourceRule("regional complaint window needs an entry"),
    ],
  );
}
