import { BounceGroup } from "./bounce-group.js";

/** A rule a bounce group must pass. Check returns its problems, or none. */
export interface BounceGroupRule {
  check(item: BounceGroup): string[];
}

export class BounceGroupCodePrefixRule implements BounceGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BounceGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BounceGroupRequiredCodeRule implements BounceGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BounceGroupRequiredCountryRule implements BounceGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceGroup): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class BounceGroupLimitRangeRule implements BounceGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceGroup): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a bounce group. */
export class BounceGroupValidator {
  rules: BounceGroupRule[];

  constructor(rules: BounceGroupRule[]) {
    this.rules = rules;
  }

  validate(item: BounceGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceGroup[]): Map<string, string[]> {
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

export function defaultBounceGroupValidator(): BounceGroupValidator {
  return new BounceGroupValidator(
    [
      new BounceGroupCodePrefixRule("REF"),
      new BounceGroupRequiredCodeRule("bounce group needs this field"),
      new BounceGroupRequiredCountryRule("bounce group needs an entry"),
      new BounceGroupLimitRangeRule(1000, 3600),
    ],
  );
}
