import * as text from "../../../../kit/text.js";
import { RollingTouchpointTarget } from "./rolling-touchpoint-target.js";

/** A rule a rolling touchpoint target must pass. Check returns its problems, or none. */
export interface RollingTouchpointTargetRule {
  check(item: RollingTouchpointTarget): string[];
}

export class RollingTouchpointTargetCodeLengthRule implements RollingTouchpointTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingTouchpointTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingTouchpointTargetCodePrefixRule implements RollingTouchpointTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingTouchpointTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingTouchpointTargetRequiredCodeRule implements RollingTouchpointTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingTouchpointTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingTouchpointTargetLimitRangeRule implements RollingTouchpointTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTouchpointTarget): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingTouchpointTargetAllowedCohortRule implements RollingTouchpointTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingTouchpointTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is unknown`];
    return [];
  }
}

export class RollingTouchpointTargetNameLengthRule implements RollingTouchpointTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingTouchpointTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling touchpoint target. */
export class RollingTouchpointTargetValidator {
  rules: RollingTouchpointTargetRule[];

  constructor(rules: RollingTouchpointTargetRule[]) {
    this.rules = rules;
  }

  validate(item: RollingTouchpointTarget): string[] {
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

  requireValid(item: RollingTouchpointTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingTouchpointTarget[]): Map<string, string[]> {
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

export function defaultRollingTouchpointTargetValidator(): RollingTouchpointTargetValidator {
  return new RollingTouchpointTargetValidator(
    [
      new RollingTouchpointTargetCodeLengthRule(86400),
      new RollingTouchpointTargetCodePrefixRule("REF"),
      new RollingTouchpointTargetRequiredCodeRule("rolling touchpoint target needs a value"),
      new RollingTouchpointTargetLimitRangeRule(32, 1000),
      new RollingTouchpointTargetAllowedCohortRule(["seasonal", "lenient", "regional"]),
      new RollingTouchpointTargetNameLengthRule(32),
    ],
  );
}
