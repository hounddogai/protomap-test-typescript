import { DefaultFunnelManifest } from "./default-funnel-manifest.js";

/** A rule a default funnel manifest must pass. Check returns its problems, or none. */
export interface DefaultFunnelManifestRule {
  check(item: DefaultFunnelManifest): string[];
}

export class DefaultFunnelManifestCodeLengthRule implements DefaultFunnelManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFunnelManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultFunnelManifestExpiresAtRangeRule implements DefaultFunnelManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultFunnelManifest): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultFunnelManifestRequiredContactEmailRule implements DefaultFunnelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFunnelManifest): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFunnelManifestRequiredVariantRule implements DefaultFunnelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultFunnelManifest): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultFunnelManifestVariantLengthRule implements DefaultFunnelManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultFunnelManifest): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default funnel manifest. */
export class DefaultFunnelManifestValidator {
  rules: DefaultFunnelManifestRule[];

  constructor(rules: DefaultFunnelManifestRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultFunnelManifest): string[] {
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

  requireValid(item: DefaultFunnelManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultFunnelManifest[]): Map<string, string[]> {
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

export function defaultDefaultFunnelManifestValidator(): DefaultFunnelManifestValidator {
  return new DefaultFunnelManifestValidator(
    [
      new DefaultFunnelManifestCodeLengthRule(120),
      new DefaultFunnelManifestExpiresAtRangeRule(64, 120),
      new DefaultFunnelManifestRequiredContactEmailRule("default funnel manifest needs an entry"),
      new DefaultFunnelManifestRequiredVariantRule("default funnel manifest needs an entry"),
      new DefaultFunnelManifestVariantLengthRule(3600),
    ],
  );
}
