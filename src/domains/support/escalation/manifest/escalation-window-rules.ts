import { EscalationWindow } from "./escalation-window.js";

/** A rule a escalation window must pass. Check returns its problems, or none. */
export interface EscalationWindowRule {
  check(item: EscalationWindow): string[];
}

export class EscalationWindowCodePrefixRule implements EscalationWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationWindowRequiredCodeRule implements EscalationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationWindowRequiredLabelRule implements EscalationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationWindowFloorValueRangeRule implements EscalationWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationWindow): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EscalationWindowRequiredRegionRule implements EscalationWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationWindow): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationWindowCodeLengthRule implements EscalationWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation window. */
export class EscalationWindowValidator {
  rules: EscalationWindowRule[];

  constructor(rules: EscalationWindowRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationWindow[]): Map<string, string[]> {
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

export function defaultEscalationWindowValidator(): EscalationWindowValidator {
  return new EscalationWindowValidator(
    [
      new EscalationWindowCodePrefixRule("REF"),
      new EscalationWindowRequiredCodeRule("escalation window needs a value"),
      new EscalationWindowRequiredLabelRule("escalation window needs a value"),
      new EscalationWindowFloorValueRangeRule(1.9, 1440),
      new EscalationWindowRequiredRegionRule("escalation window needs an entry"),
      new EscalationWindowCodeLengthRule(86400),
    ],
  );
}
