import { ScheduledFlightRule } from "./scheduled-flight-rule.js";

/** A rule a scheduled flight rule must pass. Check returns its problems, or none. */
export interface ScheduledFlightRuleRule {
  check(item: ScheduledFlightRule): string[];
}

export class ScheduledFlightRuleVariantLengthRule implements ScheduledFlightRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFlightRule): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFlightRuleMinimumRangeRule implements ScheduledFlightRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFlightRule): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledFlightRuleCodeLengthRule implements ScheduledFlightRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFlightRule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFlightRuleRequiredLabelRule implements ScheduledFlightRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFlightRule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFlightRuleCreatedAtRangeRule implements ScheduledFlightRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFlightRule): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledFlightRuleSendAtRangeRule implements ScheduledFlightRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFlightRule): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled flight rule. */
export class ScheduledFlightRuleValidator {
  rules: ScheduledFlightRuleRule[];

  constructor(rules: ScheduledFlightRuleRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFlightRule): string[] {
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

  requireValid(item: ScheduledFlightRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFlightRule[]): Map<string, string[]> {
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

export function defaultScheduledFlightRuleValidator(): ScheduledFlightRuleValidator {
  return new ScheduledFlightRuleValidator(
    [
      new ScheduledFlightRuleVariantLengthRule(64),
      new ScheduledFlightRuleMinimumRangeRule(1.1, 4175.4),
      new ScheduledFlightRuleCodeLengthRule(255),
      new ScheduledFlightRuleRequiredLabelRule("scheduled flight rule needs an entry"),
      new ScheduledFlightRuleCreatedAtRangeRule(64, 120),
      new ScheduledFlightRuleSendAtRangeRule(32, 3600),
    ],
  );
}
