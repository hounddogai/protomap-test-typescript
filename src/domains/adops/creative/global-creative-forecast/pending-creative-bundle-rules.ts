import { PendingCreativeBundle } from "./pending-creative-bundle.js";

/** A rule a pending creative bundle must pass. Check returns its problems, or none. */
export interface PendingCreativeBundleRule {
  check(item: PendingCreativeBundle): string[];
}

export class PendingCreativeBundleCodePrefixRule implements PendingCreativeBundleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingCreativeBundle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingCreativeBundleChannelLengthRule implements PendingCreativeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCreativeBundle): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCreativeBundleCodeLengthRule implements PendingCreativeBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCreativeBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingCreativeBundleRequiredChannelRule implements PendingCreativeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCreativeBundle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCreativeBundleRequiredNameRule implements PendingCreativeBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCreativeBundle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending creative bundle. */
export class PendingCreativeBundleValidator {
  rules: PendingCreativeBundleRule[];

  constructor(rules: PendingCreativeBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCreativeBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingCreativeBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCreativeBundle[]): Map<string, string[]> {
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

export function defaultPendingCreativeBundleValidator(): PendingCreativeBundleValidator {
  return new PendingCreativeBundleValidator(
    [
      new PendingCreativeBundleCodePrefixRule("X"),
      new PendingCreativeBundleChannelLengthRule(16),
      new PendingCreativeBundleCodeLengthRule(120),
      new PendingCreativeBundleRequiredChannelRule("pending creative bundle needs a value"),
      new PendingCreativeBundleRequiredNameRule("pending creative bundle needs an entry"),
    ],
  );
}
