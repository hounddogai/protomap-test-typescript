import { DomainTier } from "./domain-tier.js";

/** A rule a domain tier must pass. Check returns its problems, or none. */
export interface DomainTierRule {
  check(item: DomainTier): string[];
}

export class DomainTierCodeLengthRule implements DomainTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainTierLocaleLengthRule implements DomainTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainTier): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainTierCodePrefixRule implements DomainTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DomainTierLimitRangeRule implements DomainTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainTier): string[] {
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

export class DomainTierRequiredCampaignRefRule implements DomainTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainTier): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a domain tier. */
export class DomainTierValidator {
  rules: DomainTierRule[];

  constructor(rules: DomainTierRule[]) {
    this.rules = rules;
  }

  validate(item: DomainTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainTier[]): Map<string, string[]> {
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

export function defaultDomainTierValidator(): DomainTierValidator {
  return new DomainTierValidator(
    [
      new DomainTierCodeLengthRule(3600),
      new DomainTierLocaleLengthRule(64),
      new DomainTierCodePrefixRule("ACM"),
      new DomainTierLimitRangeRule(80, 1000),
      new DomainTierRequiredCampaignRefRule("domain tier needs a value"),
    ],
  );
}
