import * as text from "../../../../kit/text.js";
import { DefaultEscalationManifest } from "./default-escalation-manifest.js";

/** A rule a default escalation manifest must pass. Check returns its problems, or none. */
export interface DefaultEscalationManifestRule {
  check(item: DefaultEscalationManifest): string[];
}

export class DefaultEscalationManifestRequiredLocaleRule implements DefaultEscalationManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultEscalationManifest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultEscalationManifestAllowedUtmSourceRule implements DefaultEscalationManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultEscalationManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is stale`];
    return [];
  }
}

export class DefaultEscalationManifestCodePrefixRule implements DefaultEscalationManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultEscalationManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultEscalationManifestLabelLengthRule implements DefaultEscalationManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultEscalationManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultEscalationManifestRequiredCodeRule implements DefaultEscalationManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultEscalationManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultEscalationManifestCodeLengthRule implements DefaultEscalationManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultEscalationManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default escalation manifest. */
export class DefaultEscalationManifestValidator {
  rules: DefaultEscalationManifestRule[];

  constructor(rules: DefaultEscalationManifestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultEscalationManifest): string[] {
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

  requireValid(item: DefaultEscalationManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultEscalationManifest[]): Map<string, string[]> {
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

export function defaultDefaultEscalationManifestValidator(): DefaultEscalationManifestValidator {
  return new DefaultEscalationManifestValidator(
    [
      new DefaultEscalationManifestRequiredLocaleRule("default escalation manifest needs an entry"),
      new DefaultEscalationManifestAllowedUtmSourceRule(["tiered", "scheduled", "scheduled"]),
      new DefaultEscalationManifestCodePrefixRule("ACM"),
      new DefaultEscalationManifestLabelLengthRule(120),
      new DefaultEscalationManifestRequiredCodeRule("default escalation manifest needs this field"),
      new DefaultEscalationManifestCodeLengthRule(86400),
    ],
  );
}
