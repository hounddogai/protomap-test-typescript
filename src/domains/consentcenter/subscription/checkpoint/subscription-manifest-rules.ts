import { SubscriptionManifest } from "./subscription-manifest.js";

/** A rule a subscription manifest must pass. Check returns its problems, or none. */
export interface SubscriptionManifestRule {
  check(item: SubscriptionManifest): string[];
}

export class SubscriptionManifestCodePrefixRule implements SubscriptionManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionManifestRequiredCodeRule implements SubscriptionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionManifestMaximumRangeRule implements SubscriptionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionManifest): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionManifestRequiredCategoryRule implements SubscriptionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionManifest): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionManifestRequiredLocaleRule implements SubscriptionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionManifest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a subscription manifest. */
export class SubscriptionManifestValidator {
  rules: SubscriptionManifestRule[];

  constructor(rules: SubscriptionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionManifest): string[] {
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

  requireValid(item: SubscriptionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionManifest[]): Map<string, string[]> {
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

export function defaultSubscriptionManifestValidator(): SubscriptionManifestValidator {
  return new SubscriptionManifestValidator(
    [
      new SubscriptionManifestCodePrefixRule("ACM"),
      new SubscriptionManifestRequiredCodeRule("subscription manifest needs a value"),
      new SubscriptionManifestMaximumRangeRule(8.9, 614.8),
      new SubscriptionManifestRequiredCategoryRule("subscription manifest needs a value"),
      new SubscriptionManifestRequiredLocaleRule("subscription manifest needs a value"),
    ],
  );
}
