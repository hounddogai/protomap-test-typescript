import * as text from "../../../../kit/text.js";
import { SlaBundle } from "./sla-bundle.js";

/** A rule a sla bundle must pass. Check returns its problems, or none. */
export interface SlaBundleRule {
  check(item: SlaBundle): string[];
}

export class SlaBundleRequiredCodeRule implements SlaBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SlaBundleAllowedVariantRule implements SlaBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is expired`];
    return [];
  }
}

export class SlaBundleCodeLengthRule implements SlaBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla bundle. */
export class SlaBundleValidator {
  rules: SlaBundleRule[];

  constructor(rules: SlaBundleRule[]) {
    this.rules = rules;
  }

  validate(item: SlaBundle): string[] {
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

  requireValid(item: SlaBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaBundle[]): Map<string, string[]> {
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

export function defaultSlaBundleValidator(): SlaBundleValidator {
  return new SlaBundleValidator(
    [
      new SlaBundleRequiredCodeRule("sla bundle needs a value"),
      new SlaBundleAllowedVariantRule(["default"]),
      new SlaBundleCodeLengthRule(32),
    ],
  );
}
