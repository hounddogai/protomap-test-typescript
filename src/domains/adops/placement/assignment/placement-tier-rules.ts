import { PlacementTier } from "./placement-tier.js";

/** A rule a placement tier must pass. Check returns its problems, or none. */
export interface PlacementTierRule {
  check(item: PlacementTier): string[];
}

export class PlacementTierCodeLengthRule implements PlacementTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementTierRequiredNameRule implements PlacementTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementTier): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementTierDescriptionLengthRule implements PlacementTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementTier): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementTierCodePrefixRule implements PlacementTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PlacementTierRequiredDescriptionRule implements PlacementTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementTier): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementTierRequiredCodeRule implements PlacementTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a placement tier. */
export class PlacementTierValidator {
  rules: PlacementTierRule[];

  constructor(rules: PlacementTierRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementTier): string[] {
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

  requireValid(item: PlacementTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementTier[]): Map<string, string[]> {
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

export function defaultPlacementTierValidator(): PlacementTierValidator {
  return new PlacementTierValidator(
    [
      new PlacementTierCodeLengthRule(120),
      new PlacementTierRequiredNameRule("placement tier needs this field"),
      new PlacementTierDescriptionLengthRule(3600),
      new PlacementTierCodePrefixRule("ACM"),
      new PlacementTierRequiredDescriptionRule("placement tier needs an entry"),
      new PlacementTierRequiredCodeRule("placement tier needs this field"),
    ],
  );
}
