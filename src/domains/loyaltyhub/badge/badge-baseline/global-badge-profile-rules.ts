import { GlobalBadgeProfile } from "./global-badge-profile.js";

/** A rule a global badge profile must pass. Check returns its problems, or none. */
export interface GlobalBadgeProfileRule {
  check(item: GlobalBadgeProfile): string[];
}

export class GlobalBadgeProfileRequiredNameRule implements GlobalBadgeProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBadgeProfile): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalBadgeProfileLimitRangeRule implements GlobalBadgeProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBadgeProfile): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalBadgeProfileCodePrefixRule implements GlobalBadgeProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalBadgeProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global badge profile. */
export class GlobalBadgeProfileValidator {
  rules: GlobalBadgeProfileRule[];

  constructor(rules: GlobalBadgeProfileRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBadgeProfile): string[] {
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

  requireValid(item: GlobalBadgeProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBadgeProfile[]): Map<string, string[]> {
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

export function defaultGlobalBadgeProfileValidator(): GlobalBadgeProfileValidator {
  return new GlobalBadgeProfileValidator(
    [
      new GlobalBadgeProfileRequiredNameRule("global badge profile needs a value"),
      new GlobalBadgeProfileLimitRangeRule(80, 80),
      new GlobalBadgeProfileCodePrefixRule("ACM"),
    ],
  );
}
