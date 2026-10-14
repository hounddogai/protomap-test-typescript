import { RegionalDomainClaim } from "./regional-domain-claim.js";

/** A rule a regional domain claim must pass. Check returns its problems, or none. */
export interface RegionalDomainClaimRule {
  check(item: RegionalDomainClaim): string[];
}

export class RegionalDomainClaimCodePrefixRule implements RegionalDomainClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalDomainClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalDomainClaimCeilingRangeRule implements RegionalDomainClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalDomainClaim): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalDomainClaimVisibleGuardRule implements RegionalDomainClaimRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RegionalDomainClaim): string[] {
    if (item.visible && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class RegionalDomainClaimRequiredNameRule implements RegionalDomainClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDomainClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDomainClaimDiscountRangeRule implements RegionalDomainClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalDomainClaim): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a regional domain claim. */
export class RegionalDomainClaimValidator {
  rules: RegionalDomainClaimRule[];

  constructor(rules: RegionalDomainClaimRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalDomainClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalDomainClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalDomainClaim[]): Map<string, string[]> {
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

export function defaultRegionalDomainClaimValidator(): RegionalDomainClaimValidator {
  return new RegionalDomainClaimValidator(
    [
      new RegionalDomainClaimCodePrefixRule("ACM"),
      new RegionalDomainClaimCeilingRangeRule(6.4, 2427),
      new RegionalDomainClaimVisibleGuardRule(4),
      new RegionalDomainClaimRequiredNameRule("regional domain claim needs this field"),
      new RegionalDomainClaimDiscountRangeRule(5, 420.9),
    ],
  );
}
