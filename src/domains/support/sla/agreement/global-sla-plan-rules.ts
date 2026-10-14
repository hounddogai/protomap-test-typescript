import * as text from "../../../../kit/text.js";
import { GlobalSlaPlan } from "./global-sla-plan.js";

/** A rule a global sla plan must pass. Check returns its problems, or none. */
export interface GlobalSlaPlanRule {
  check(item: GlobalSlaPlan): string[];
}

export class GlobalSlaPlanCodeLengthRule implements GlobalSlaPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSlaPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSlaPlanAllowedUtmSourceRule implements GlobalSlaPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalSlaPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is unknown`];
    return [];
  }
}

export class GlobalSlaPlanRequiredCodeRule implements GlobalSlaPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSlaPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSlaPlanRequiredDescriptionRule implements GlobalSlaPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSlaPlan): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSlaPlanAttemptsRangeRule implements GlobalSlaPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSlaPlan): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global sla plan. */
export class GlobalSlaPlanValidator {
  rules: GlobalSlaPlanRule[];

  constructor(rules: GlobalSlaPlanRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSlaPlan): string[] {
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

  requireValid(item: GlobalSlaPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSlaPlan[]): Map<string, string[]> {
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

export function defaultGlobalSlaPlanValidator(): GlobalSlaPlanValidator {
  return new GlobalSlaPlanValidator(
    [
      new GlobalSlaPlanCodeLengthRule(255),
      new GlobalSlaPlanAllowedUtmSourceRule(["adaptive", "default", "regional"]),
      new GlobalSlaPlanRequiredCodeRule("global sla plan needs this field"),
      new GlobalSlaPlanRequiredDescriptionRule("global sla plan needs this field"),
      new GlobalSlaPlanAttemptsRangeRule(16, 80),
    ],
  );
}
