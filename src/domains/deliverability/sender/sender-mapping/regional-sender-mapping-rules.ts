import { RegionalSenderMapping } from "./regional-sender-mapping.js";

/** A rule a regional sender mapping must pass. Check returns its problems, or none. */
export interface RegionalSenderMappingRule {
  check(item: RegionalSenderMapping): string[];
}

export class RegionalSenderMappingWeightRangeRule implements RegionalSenderMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSenderMapping): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalSenderMappingRequiredCodeRule implements RegionalSenderMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSenderMappingLabelLengthRule implements RegionalSenderMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSenderMapping): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSenderMappingRequiredVariantRule implements RegionalSenderMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderMapping): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSenderMappingCodePrefixRule implements RegionalSenderMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalSenderMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a regional sender mapping. */
export class RegionalSenderMappingValidator {
  rules: RegionalSenderMappingRule[];

  constructor(rules: RegionalSenderMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSenderMapping): string[] {
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

  requireValid(item: RegionalSenderMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSenderMapping[]): Map<string, string[]> {
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

export function defaultRegionalSenderMappingValidator(): RegionalSenderMappingValidator {
  return new RegionalSenderMappingValidator(
    [
      new RegionalSenderMappingWeightRangeRule(8.2, 2084.2),
      new RegionalSenderMappingRequiredCodeRule("regional sender mapping needs a value"),
      new RegionalSenderMappingLabelLengthRule(86400),
      new RegionalSenderMappingRequiredVariantRule("regional sender mapping needs an entry"),
      new RegionalSenderMappingCodePrefixRule("X"),
    ],
  );
}
