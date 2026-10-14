import * as text from "../../../../kit/text.js";
import { SlaRollup } from "./sla-rollup.js";

/** A rule a sla rollup must pass. Check returns its problems, or none. */
export interface SlaRollupRule {
  check(item: SlaRollup): string[];
}

export class SlaRollupRequiredLabelRule implements SlaRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SlaRollupRequiredPhoneRule implements SlaRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaRollup): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class SlaRollupAllowedPhoneRule implements SlaRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is missing`];
    return [];
  }
}

export class SlaRollupUtmSourceLengthRule implements SlaRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaRollup): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla rollup. */
export class SlaRollupValidator {
  rules: SlaRollupRule[];

  constructor(rules: SlaRollupRule[]) {
    this.rules = rules;
  }

  validate(item: SlaRollup): string[] {
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

  requireValid(item: SlaRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaRollup[]): Map<string, string[]> {
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

export function defaultSlaRollupValidator(): SlaRollupValidator {
  return new SlaRollupValidator(
    [
      new SlaRollupRequiredLabelRule("sla rollup needs a value"),
      new SlaRollupRequiredPhoneRule("sla rollup needs a value"),
      new SlaRollupAllowedPhoneRule(["seasonal", "seasonal", "batched"]),
      new SlaRollupUtmSourceLengthRule(255),
    ],
  );
}
