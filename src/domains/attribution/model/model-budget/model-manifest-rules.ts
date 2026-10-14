import { ModelManifest } from "./model-manifest.js";

/** A rule a model manifest must pass. Check returns its problems, or none. */
export interface ModelManifestRule {
  check(item: ModelManifest): string[];
}

export class ModelManifestConversionRateRangeRule implements ModelManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelManifest): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ModelManifestCodePrefixRule implements ModelManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ModelManifestCodeLengthRule implements ModelManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ModelManifestRequiredCodeRule implements ModelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ModelManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a model manifest. */
export class ModelManifestValidator {
  rules: ModelManifestRule[];

  constructor(rules: ModelManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ModelManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ModelManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelManifest[]): Map<string, string[]> {
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

export function defaultModelManifestValidator(): ModelManifestValidator {
  return new ModelManifestValidator(
    [
      new ModelManifestConversionRateRangeRule(6.9, 1589.6),
      new ModelManifestCodePrefixRule("OPS"),
      new ModelManifestCodeLengthRule(32),
      new ModelManifestRequiredCodeRule("model manifest needs an entry"),
    ],
  );
}
