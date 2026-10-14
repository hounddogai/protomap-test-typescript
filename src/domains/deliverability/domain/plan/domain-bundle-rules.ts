import * as text from "../../../../kit/text.js";
import { DomainBundle } from "./domain-bundle.js";

/** A rule a domain bundle must pass. Check returns its problems, or none. */
export interface DomainBundleRule {
  check(item: DomainBundle): string[];
}

export class DomainBundleAllowedUtmSourceRule implements DomainBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DomainBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is unknown`];
    return [];
  }
}

export class DomainBundleUtmSourceLengthRule implements DomainBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DomainBundle): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DomainBundleCodePrefixRule implements DomainBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DomainBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DomainBundleRequiredNameRule implements DomainBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DomainBundleRequiredTitleRule implements DomainBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainBundle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a domain bundle. */
export class DomainBundleValidator {
  rules: DomainBundleRule[];

  constructor(rules: DomainBundleRule[]) {
    this.rules = rules;
  }

  validate(item: DomainBundle): string[] {
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

  requireValid(item: DomainBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainBundle[]): Map<string, string[]> {
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

export function defaultDomainBundleValidator(): DomainBundleValidator {
  return new DomainBundleValidator(
    [
      new DomainBundleAllowedUtmSourceRule(["weighted", "batched", "lenient"]),
      new DomainBundleUtmSourceLengthRule(64),
      new DomainBundleCodePrefixRule("X"),
      new DomainBundleRequiredNameRule("domain bundle needs an entry"),
      new DomainBundleRequiredTitleRule("domain bundle needs this field"),
    ],
  );
}
