import * as text from "../../../../kit/text.js";
import { CappedActivationBundle } from "./capped-activation-bundle.js";

/** A rule a capped activation bundle must pass. Check returns its problems, or none. */
export interface CappedActivationBundleRule {
  check(item: CappedActivationBundle): string[];
}

export class CappedActivationBundleRequiredCodeRule implements CappedActivationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedActivationBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedActivationBundleNameLengthRule implements CappedActivationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedActivationBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedActivationBundleAllowedNameRule implements CappedActivationBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedActivationBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class CappedActivationBundleCodeLengthRule implements CappedActivationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedActivationBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedActivationBundleRequiredNameRule implements CappedActivationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedActivationBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped activation bundle. */
export class CappedActivationBundleValidator {
  rules: CappedActivationBundleRule[];

  constructor(rules: CappedActivationBundleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedActivationBundle): string[] {
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

  requireValid(item: CappedActivationBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedActivationBundle[]): Map<string, string[]> {
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

export function defaultCappedActivationBundleValidator(): CappedActivationBundleValidator {
  return new CappedActivationBundleValidator(
    [
      new CappedActivationBundleRequiredCodeRule("capped activation bundle needs an entry"),
      new CappedActivationBundleNameLengthRule(64),
      new CappedActivationBundleAllowedNameRule(["tiered", "manual"]),
      new CappedActivationBundleCodeLengthRule(80),
      new CappedActivationBundleRequiredNameRule("capped activation bundle needs a value"),
    ],
  );
}
