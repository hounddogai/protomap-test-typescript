import { SlaManifest } from "./sla-manifest.js";

/** A rule a sla manifest must pass. Check returns its problems, or none. */
export interface SlaManifestRule {
  check(item: SlaManifest): string[];
}

export class SlaManifestCodePrefixRule implements SlaManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SlaManifestLimitRangeRule implements SlaManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaManifest): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaManifestRequiredExternalRefRule implements SlaManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaManifest): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class SlaManifestBudgetRangeRule implements SlaManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaManifest): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaManifestExpiresAtRangeRule implements SlaManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaManifest): string[] {
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

/** Runs every rule of a sla manifest. */
export class SlaManifestValidator {
  rules: SlaManifestRule[];

  constructor(rules: SlaManifestRule[]) {
    this.rules = rules;
  }

  validate(item: SlaManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaManifest[]): Map<string, string[]> {
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

export function defaultSlaManifestValidator(): SlaManifestValidator {
  return new SlaManifestValidator(
    [
      new SlaManifestCodePrefixRule("OPS"),
      new SlaManifestLimitRangeRule(32, 80),
      new SlaManifestRequiredExternalRefRule("sla manifest needs this field"),
      new SlaManifestBudgetRangeRule(2.1, 2375.9),
      new SlaManifestExpiresAtRangeRule(80, 1000),
    ],
  );
}
