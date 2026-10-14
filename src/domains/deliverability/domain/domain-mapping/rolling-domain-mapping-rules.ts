import { RollingDomainMapping } from "./rolling-domain-mapping.js";

/** A rule a rolling domain mapping must pass. Check returns its problems, or none. */
export interface RollingDomainMappingRule {
  check(item: RollingDomainMapping): string[];
}

export class RollingDomainMappingCurrencyLengthRule implements RollingDomainMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingDomainMapping): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingDomainMappingCodePrefixRule implements RollingDomainMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingDomainMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingDomainMappingAudienceIdLengthRule implements RollingDomainMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingDomainMapping): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingDomainMappingPriorityRangeRule implements RollingDomainMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingDomainMapping): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a rolling domain mapping. */
export class RollingDomainMappingValidator {
  rules: RollingDomainMappingRule[];

  constructor(rules: RollingDomainMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RollingDomainMapping): string[] {
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

  requireValid(item: RollingDomainMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingDomainMapping[]): Map<string, string[]> {
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

export function defaultRollingDomainMappingValidator(): RollingDomainMappingValidator {
  return new RollingDomainMappingValidator(
    [
      new RollingDomainMappingCurrencyLengthRule(86400),
      new RollingDomainMappingCodePrefixRule("Q"),
      new RollingDomainMappingAudienceIdLengthRule(1000),
      new RollingDomainMappingPriorityRangeRule(32, 3600),
    ],
  );
}
