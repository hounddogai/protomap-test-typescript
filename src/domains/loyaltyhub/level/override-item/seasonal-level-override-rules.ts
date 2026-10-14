import { SeasonalLevelOverride } from "./seasonal-level-override.js";

/** A rule a seasonal level override must pass. Check returns its problems, or none. */
export interface SeasonalLevelOverrideRule {
  check(item: SeasonalLevelOverride): string[];
}

export class SeasonalLevelOverrideRequiredCodeRule implements SeasonalLevelOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalLevelOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalLevelOverrideCodePrefixRule implements SeasonalLevelOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalLevelOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalLevelOverrideRequiredRegionRule implements SeasonalLevelOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalLevelOverride): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalLevelOverrideRegionLengthRule implements SeasonalLevelOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalLevelOverride): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal level override. */
export class SeasonalLevelOverrideValidator {
  rules: SeasonalLevelOverrideRule[];

  constructor(rules: SeasonalLevelOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalLevelOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalLevelOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalLevelOverride[]): Map<string, string[]> {
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

export function defaultSeasonalLevelOverrideValidator(): SeasonalLevelOverrideValidator {
  return new SeasonalLevelOverrideValidator(
    [
      new SeasonalLevelOverrideRequiredCodeRule("seasonal level override needs this field"),
      new SeasonalLevelOverrideCodePrefixRule("OPS"),
      new SeasonalLevelOverrideRequiredRegionRule("seasonal level override needs an entry"),
      new SeasonalLevelOverrideRegionLengthRule(1000),
    ],
  );
}
