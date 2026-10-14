import { GlobalFlightEstimate } from "./global-flight-estimate.js";

/** A rule a global flight estimate must pass. Check returns its problems, or none. */
export interface GlobalFlightEstimateRule {
  check(item: GlobalFlightEstimate): string[];
}

export class GlobalFlightEstimateArchivedGuardRule implements GlobalFlightEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalFlightEstimate): string[] {
    if (item.archived && item.quantity > this.limit) return [`quantity ${item.quantity} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class GlobalFlightEstimateRequiredChannelRule implements GlobalFlightEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalFlightEstimate): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalFlightEstimateCodeLengthRule implements GlobalFlightEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFlightEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFlightEstimateCountryLengthRule implements GlobalFlightEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFlightEstimate): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFlightEstimateQuantityRangeRule implements GlobalFlightEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalFlightEstimate): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalFlightEstimateCodePrefixRule implements GlobalFlightEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalFlightEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global flight estimate. */
export class GlobalFlightEstimateValidator {
  rules: GlobalFlightEstimateRule[];

  constructor(rules: GlobalFlightEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFlightEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalFlightEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFlightEstimate[]): Map<string, string[]> {
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

export function defaultGlobalFlightEstimateValidator(): GlobalFlightEstimateValidator {
  return new GlobalFlightEstimateValidator(
    [
      new GlobalFlightEstimateArchivedGuardRule(1000),
      new GlobalFlightEstimateRequiredChannelRule("global flight estimate needs a value"),
      new GlobalFlightEstimateCodeLengthRule(86400),
      new GlobalFlightEstimateCountryLengthRule(3600),
      new GlobalFlightEstimateQuantityRangeRule(32, 86400),
      new GlobalFlightEstimateCodePrefixRule("OPS"),
    ],
  );
}
