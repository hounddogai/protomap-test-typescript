import { AdaptiveCreativeBundle } from "./adaptive-creative-bundle.js";

/** A rule a adaptive creative bundle must pass. Check returns its problems, or none. */
export interface AdaptiveCreativeBundleRule {
  check(item: AdaptiveCreativeBundle): string[];
}

export class AdaptiveCreativeBundleCodeLengthRule implements AdaptiveCreativeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCreativeBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveCreativeBundleRequiredLabelRule implements AdaptiveCreativeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCreativeBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCreativeBundleFrequencyCapRangeRule implements AdaptiveCreativeBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCreativeBundle): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveCreativeBundleRequiredCodeRule implements AdaptiveCreativeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCreativeBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCreativeBundleRequiredNameRule implements AdaptiveCreativeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCreativeBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCreativeBundleNameLengthRule implements AdaptiveCreativeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCreativeBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive creative bundle. */
export class AdaptiveCreativeBundleValidator {
  rules: AdaptiveCreativeBundleRule[];

  constructor(rules: AdaptiveCreativeBundleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCreativeBundle): string[] {
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

  requireValid(item: AdaptiveCreativeBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCreativeBundle[]): Map<string, string[]> {
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

export function defaultAdaptiveCreativeBundleValidator(): AdaptiveCreativeBundleValidator {
  return new AdaptiveCreativeBundleValidator(
    [
      new AdaptiveCreativeBundleCodeLengthRule(120),
      new AdaptiveCreativeBundleRequiredLabelRule("adaptive creative bundle needs a value"),
      new AdaptiveCreativeBundleFrequencyCapRangeRule(64, 86400),
      new AdaptiveCreativeBundleRequiredCodeRule("adaptive creative bundle needs an entry"),
      new AdaptiveCreativeBundleRequiredNameRule("adaptive creative bundle needs an entry"),
      new AdaptiveCreativeBundleNameLengthRule(86400),
    ],
  );
}
