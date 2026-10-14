import { RegionalDomainRollup } from "./regional-domain-rollup.js";

/** A rule a regional domain rollup must pass. Check returns its problems, or none. */
export interface RegionalDomainRollupRule {
  check(item: RegionalDomainRollup): string[];
}

export class RegionalDomainRollupRequiredNameRule implements RegionalDomainRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDomainRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDomainRollupCodeLengthRule implements RegionalDomainRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalDomainRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalDomainRollupRequiredVariantRule implements RegionalDomainRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDomainRollup): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDomainRollupRequiredUtmSourceRule implements RegionalDomainRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDomainRollup): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDomainRollupNameLengthRule implements RegionalDomainRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalDomainRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional domain rollup. */
export class RegionalDomainRollupValidator {
  rules: RegionalDomainRollupRule[];

  constructor(rules: RegionalDomainRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalDomainRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalDomainRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalDomainRollup[]): Map<string, string[]> {
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

export function defaultRegionalDomainRollupValidator(): RegionalDomainRollupValidator {
  return new RegionalDomainRollupValidator(
    [
      new RegionalDomainRollupRequiredNameRule("regional domain rollup needs an entry"),
      new RegionalDomainRollupCodeLengthRule(16),
      new RegionalDomainRollupRequiredVariantRule("regional domain rollup needs an entry"),
      new RegionalDomainRollupRequiredUtmSourceRule("regional domain rollup needs this field"),
      new RegionalDomainRollupNameLengthRule(32),
    ],
  );
}
