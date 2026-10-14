import * as text from "../../../../kit/text.js";
import { CsatTarget } from "./csat-target.js";

/** A rule a csat target must pass. Check returns its problems, or none. */
export interface CsatTargetRule {
  check(item: CsatTarget): string[];
}

export class CsatTargetAllowedCodeRule implements CsatTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

export class CsatTargetRequiredNameRule implements CsatTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CsatTargetMaximumRangeRule implements CsatTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatTarget): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CsatTargetActiveGuardRule implements CsatTargetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CsatTarget): string[] {
    if (item.active && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while active`];
    return [];
  }
}

export class CsatTargetFloorValueRangeRule implements CsatTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatTarget): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CsatTargetRequiredDescriptionRule implements CsatTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatTarget): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a csat target. */
export class CsatTargetValidator {
  rules: CsatTargetRule[];

  constructor(rules: CsatTargetRule[]) {
    this.rules = rules;
  }

  validate(item: CsatTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CsatTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatTarget[]): Map<string, string[]> {
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

export function defaultCsatTargetValidator(): CsatTargetValidator {
  return new CsatTargetValidator(
    [
      new CsatTargetAllowedCodeRule(["rolling", "seasonal", "capped"]),
      new CsatTargetRequiredNameRule("csat target needs an entry"),
      new CsatTargetMaximumRangeRule(4.4, 3286.4),
      new CsatTargetActiveGuardRule(9.5),
      new CsatTargetFloorValueRangeRule(9.4, 3043.8),
      new CsatTargetRequiredDescriptionRule("csat target needs an entry"),
    ],
  );
}
