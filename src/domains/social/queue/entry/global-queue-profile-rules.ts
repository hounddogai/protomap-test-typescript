import * as text from "../../../../kit/text.js";
import { GlobalQueueProfile } from "./global-queue-profile.js";

/** A rule a global queue profile must pass. Check returns its problems, or none. */
export interface GlobalQueueProfileRule {
  check(item: GlobalQueueProfile): string[];
}

export class GlobalQueueProfileUnitLengthRule implements GlobalQueueProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalQueueProfile): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalQueueProfileRequiredCodeRule implements GlobalQueueProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalQueueProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalQueueProfileLabelLengthRule implements GlobalQueueProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalQueueProfile): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalQueueProfileCodePrefixRule implements GlobalQueueProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalQueueProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalQueueProfileExternalRefLengthRule implements GlobalQueueProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalQueueProfile): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalQueueProfileAllowedCodeRule implements GlobalQueueProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalQueueProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

/** Runs every rule of a global queue profile. */
export class GlobalQueueProfileValidator {
  rules: GlobalQueueProfileRule[];

  constructor(rules: GlobalQueueProfileRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalQueueProfile): string[] {
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

  requireValid(item: GlobalQueueProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalQueueProfile[]): Map<string, string[]> {
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

export function defaultGlobalQueueProfileValidator(): GlobalQueueProfileValidator {
  return new GlobalQueueProfileValidator(
    [
      new GlobalQueueProfileUnitLengthRule(80),
      new GlobalQueueProfileRequiredCodeRule("global queue profile needs this field"),
      new GlobalQueueProfileLabelLengthRule(80),
      new GlobalQueueProfileCodePrefixRule("OPS"),
      new GlobalQueueProfileExternalRefLengthRule(3600),
      new GlobalQueueProfileAllowedCodeRule(["fallback", "seasonal", "rolling"]),
    ],
  );
}
