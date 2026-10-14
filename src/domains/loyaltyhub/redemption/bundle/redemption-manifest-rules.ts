import { RedemptionManifest } from "./redemption-manifest.js";

/** A rule a redemption manifest must pass. Check returns its problems, or none. */
export interface RedemptionManifestRule {
  check(item: RedemptionManifest): string[];
}

export class RedemptionManifestScoreRangeRule implements RedemptionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionManifest): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RedemptionManifestAmountRangeRule implements RedemptionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionManifest): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RedemptionManifestCodePrefixRule implements RedemptionManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionManifestRequiredNameRule implements RedemptionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionManifestCodeLengthRule implements RedemptionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption manifest. */
export class RedemptionManifestValidator {
  rules: RedemptionManifestRule[];

  constructor(rules: RedemptionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionManifest): string[] {
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

  requireValid(item: RedemptionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionManifest[]): Map<string, string[]> {
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

export function defaultRedemptionManifestValidator(): RedemptionManifestValidator {
  return new RedemptionManifestValidator(
    [
      new RedemptionManifestScoreRangeRule(7.5, 4179.5),
      new RedemptionManifestAmountRangeRule(2.6, 933.2),
      new RedemptionManifestCodePrefixRule("X"),
      new RedemptionManifestRequiredNameRule("redemption manifest needs an entry"),
      new RedemptionManifestCodeLengthRule(64),
    ],
  );
}
