import * as text from "../../../../kit/text.js";
import { EscalationManifest } from "./escalation-manifest.js";

/** A rule a escalation manifest must pass. Check returns its problems, or none. */
export interface EscalationManifestRule {
  check(item: EscalationManifest): string[];
}

export class EscalationManifestRequiredNameRule implements EscalationManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationManifestChecksumLengthRule implements EscalationManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationManifest): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationManifestCodePrefixRule implements EscalationManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationManifestCostRangeRule implements EscalationManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationManifest): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationManifestAllowedCodeRule implements EscalationManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a escalation manifest. */
export class EscalationManifestValidator {
  rules: EscalationManifestRule[];

  constructor(rules: EscalationManifestRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationManifest[]): Map<string, string[]> {
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

export function defaultEscalationManifestValidator(): EscalationManifestValidator {
  return new EscalationManifestValidator(
    [
      new EscalationManifestRequiredNameRule("escalation manifest needs an entry"),
      new EscalationManifestChecksumLengthRule(16),
      new EscalationManifestCodePrefixRule("Q"),
      new EscalationManifestCostRangeRule(7.3, 1487.4),
      new EscalationManifestAllowedCodeRule(["global", "pending"]),
    ],
  );
}
