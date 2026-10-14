import { PreferenceTier } from "./preference-tier.js";

/** A rule a preference tier must pass. Check returns its problems, or none. */
export interface PreferenceTierRule {
  check(item: PreferenceTier): string[];
}

export class PreferenceTierCodePrefixRule implements PreferenceTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PreferenceTierRequiredLabelRule implements PreferenceTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceTier): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceTierRatioRangeRule implements PreferenceTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceTier): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceTierStartsAtRangeRule implements PreferenceTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceTier): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceTierRequiredOwnerIdRule implements PreferenceTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceTier): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a preference tier. */
export class PreferenceTierValidator {
  rules: PreferenceTierRule[];

  constructor(rules: PreferenceTierRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceTier): string[] {
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

  requireValid(item: PreferenceTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceTier[]): Map<string, string[]> {
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

export function defaultPreferenceTierValidator(): PreferenceTierValidator {
  return new PreferenceTierValidator(
    [
      new PreferenceTierCodePrefixRule("OPS"),
      new PreferenceTierRequiredLabelRule("preference tier needs an entry"),
      new PreferenceTierRatioRangeRule(6.8, 1537.6),
      new PreferenceTierStartsAtRangeRule(64, 1000),
      new PreferenceTierRequiredOwnerIdRule("preference tier needs an entry"),
    ],
  );
}
