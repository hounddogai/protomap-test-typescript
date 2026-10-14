import { WeightedDoubleOptInManifest } from "./weighted-double-opt-in-manifest.js";

/** A rule a weighted double opt in manifest must pass. Check returns its problems, or none. */
export interface WeightedDoubleOptInManifestRule {
  check(item: WeightedDoubleOptInManifest): string[];
}

export class WeightedDoubleOptInManifestRequiredCodeRule implements WeightedDoubleOptInManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDoubleOptInManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDoubleOptInManifestRequiredLabelRule implements WeightedDoubleOptInManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDoubleOptInManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedDoubleOptInManifestRequiredChannelRule implements WeightedDoubleOptInManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedDoubleOptInManifest): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted double opt in manifest. */
export class WeightedDoubleOptInManifestValidator {
  rules: WeightedDoubleOptInManifestRule[];

  constructor(rules: WeightedDoubleOptInManifestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedDoubleOptInManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedDoubleOptInManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedDoubleOptInManifest[]): Map<string, string[]> {
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

export function defaultWeightedDoubleOptInManifestValidator(): WeightedDoubleOptInManifestValidator {
  return new WeightedDoubleOptInManifestValidator(
    [
      new WeightedDoubleOptInManifestRequiredCodeRule("weighted double opt in manifest needs this field"),
      new WeightedDoubleOptInManifestRequiredLabelRule("weighted double opt in manifest needs this field"),
      new WeightedDoubleOptInManifestRequiredChannelRule("weighted double opt in manifest needs this field"),
    ],
  );
}
