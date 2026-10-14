import { AdaptivePlacementManifest } from "./adaptive-placement-manifest.js";

/** A rule a adaptive placement manifest must pass. Check returns its problems, or none. */
export interface AdaptivePlacementManifestRule {
  check(item: AdaptivePlacementManifest): string[];
}

export class AdaptivePlacementManifestLabelLengthRule implements AdaptivePlacementManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePlacementManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePlacementManifestCreatedAtRangeRule implements AdaptivePlacementManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePlacementManifest): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptivePlacementManifestRequiredLabelRule implements AdaptivePlacementManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePlacementManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePlacementManifestCodeLengthRule implements AdaptivePlacementManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePlacementManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePlacementManifestWeightRangeRule implements AdaptivePlacementManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePlacementManifest): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive placement manifest. */
export class AdaptivePlacementManifestValidator {
  rules: AdaptivePlacementManifestRule[];

  constructor(rules: AdaptivePlacementManifestRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePlacementManifest): string[] {
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

  requireValid(item: AdaptivePlacementManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePlacementManifest[]): Map<string, string[]> {
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

export function defaultAdaptivePlacementManifestValidator(): AdaptivePlacementManifestValidator {
  return new AdaptivePlacementManifestValidator(
    [
      new AdaptivePlacementManifestLabelLengthRule(86400),
      new AdaptivePlacementManifestCreatedAtRangeRule(255, 3600),
      new AdaptivePlacementManifestRequiredLabelRule("adaptive placement manifest needs a value"),
      new AdaptivePlacementManifestCodeLengthRule(16),
      new AdaptivePlacementManifestWeightRangeRule(1.2, 3007.3),
    ],
  );
}
