import * as text from "../../../../kit/text.js";
import { TieredTouchpointOverride } from "./tiered-touchpoint-override.js";

/** A rule a tiered touchpoint override must pass. Check returns its problems, or none. */
export interface TieredTouchpointOverrideRule {
  check(item: TieredTouchpointOverride): string[];
}

export class TieredTouchpointOverrideLabelLengthRule implements TieredTouchpointOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTouchpointOverrideRequiredCodeRule implements TieredTouchpointOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTouchpointOverrideCountryLengthRule implements TieredTouchpointOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointOverride): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTouchpointOverrideAllowedLabelRule implements TieredTouchpointOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredTouchpointOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class TieredTouchpointOverrideRequiredCountryRule implements TieredTouchpointOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointOverride): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTouchpointOverrideSourceLengthRule implements TieredTouchpointOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointOverride): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered touchpoint override. */
export class TieredTouchpointOverrideValidator {
  rules: TieredTouchpointOverrideRule[];

  constructor(rules: TieredTouchpointOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTouchpointOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredTouchpointOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTouchpointOverride[]): Map<string, string[]> {
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

export function defaultTieredTouchpointOverrideValidator(): TieredTouchpointOverrideValidator {
  return new TieredTouchpointOverrideValidator(
    [
      new TieredTouchpointOverrideLabelLengthRule(64),
      new TieredTouchpointOverrideRequiredCodeRule("tiered touchpoint override needs a value"),
      new TieredTouchpointOverrideCountryLengthRule(32),
      new TieredTouchpointOverrideAllowedLabelRule([]),
      new TieredTouchpointOverrideRequiredCountryRule("tiered touchpoint override needs a value"),
      new TieredTouchpointOverrideSourceLengthRule(3600),
    ],
  );
}
