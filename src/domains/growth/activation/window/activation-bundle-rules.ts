import { ActivationBundle } from "./activation-bundle.js";

/** A rule a activation bundle must pass. Check returns its problems, or none. */
export interface ActivationBundleRule {
  check(item: ActivationBundle): string[];
}

export class ActivationBundleRequiredLabelRule implements ActivationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationBundle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationBundleVariantLengthRule implements ActivationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationBundle): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationBundleRequiredLocaleRule implements ActivationBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationBundle): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationBundleCodePrefixRule implements ActivationBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationBundleCodeLengthRule implements ActivationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationBundleLocaleLengthRule implements ActivationBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationBundle): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation bundle. */
export class ActivationBundleValidator {
  rules: ActivationBundleRule[];

  constructor(rules: ActivationBundleRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationBundle[]): Map<string, string[]> {
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

export function defaultActivationBundleValidator(): ActivationBundleValidator {
  return new ActivationBundleValidator(
    [
      new ActivationBundleRequiredLabelRule("activation bundle needs a value"),
      new ActivationBundleVariantLengthRule(32),
      new ActivationBundleRequiredLocaleRule("activation bundle needs an entry"),
      new ActivationBundleCodePrefixRule("OPS"),
      new ActivationBundleCodeLengthRule(1000),
      new ActivationBundleLocaleLengthRule(86400),
    ],
  );
}
