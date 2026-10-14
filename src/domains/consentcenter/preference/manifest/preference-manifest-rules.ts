import { PreferenceManifest } from "./preference-manifest.js";

/** A rule a preference manifest must pass. Check returns its problems, or none. */
export interface PreferenceManifestRule {
  check(item: PreferenceManifest): string[];
}

export class PreferenceManifestLimitRangeRule implements PreferenceManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceManifest): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceManifestTitleLengthRule implements PreferenceManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceManifestOpenRateRangeRule implements PreferenceManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceManifest): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceManifestRequiredVariantRule implements PreferenceManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceManifest): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceManifestCodeLengthRule implements PreferenceManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceManifestCodePrefixRule implements PreferenceManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a preference manifest. */
export class PreferenceManifestValidator {
  rules: PreferenceManifestRule[];

  constructor(rules: PreferenceManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceManifest[]): Map<string, string[]> {
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

export function defaultPreferenceManifestValidator(): PreferenceManifestValidator {
  return new PreferenceManifestValidator(
    [
      new PreferenceManifestLimitRangeRule(64, 64),
      new PreferenceManifestTitleLengthRule(255),
      new PreferenceManifestOpenRateRangeRule(6, 4914.9),
      new PreferenceManifestRequiredVariantRule("preference manifest needs a value"),
      new PreferenceManifestCodeLengthRule(86400),
      new PreferenceManifestCodePrefixRule("ACM"),
    ],
  );
}
