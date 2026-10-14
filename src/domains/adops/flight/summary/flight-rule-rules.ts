import { FlightRule } from "./flight-rule.js";

/** A rule a flight rule must pass. Check returns its problems, or none. */
export interface FlightRuleRule {
  check(item: FlightRule): string[];
}

export class FlightRuleCodePrefixRule implements FlightRuleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FlightRule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FlightRuleRequiredNameRule implements FlightRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightRule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FlightRuleLimitRangeRule implements FlightRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FlightRule): string[] {
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

export class FlightRuleNameLengthRule implements FlightRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightRuleCodeLengthRule implements FlightRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FlightRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FlightRuleRequiredSummaryRule implements FlightRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FlightRule): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a flight rule. */
export class FlightRuleValidator {
  rules: FlightRuleRule[];

  constructor(rules: FlightRuleRule[]) {
    this.rules = rules;
  }

  validate(item: FlightRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FlightRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FlightRule[]): Map<string, string[]> {
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

export function defaultFlightRuleValidator(): FlightRuleValidator {
  return new FlightRuleValidator(
    [
      new FlightRuleCodePrefixRule("OPS"),
      new FlightRuleRequiredNameRule("flight rule needs an entry"),
      new FlightRuleLimitRangeRule(80, 1000),
      new FlightRuleNameLengthRule(3600),
      new FlightRuleCodeLengthRule(16),
      new FlightRuleRequiredSummaryRule("flight rule needs this field"),
    ],
  );
}
