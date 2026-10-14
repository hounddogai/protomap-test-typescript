import { WarmupBaseline } from "./warmup-baseline.js";

/** A rule a warmup baseline must pass. Check returns its problems, or none. */
export interface WarmupBaselineRule {
  check(item: WarmupBaseline): string[];
}

export class WarmupBaselineRequiredCodeRule implements WarmupBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupBaselineCodePrefixRule implements WarmupBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupBaselineCodeLengthRule implements WarmupBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupBaselineRequiredNameRule implements WarmupBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupBaselineNameLengthRule implements WarmupBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a warmup baseline. */
export class WarmupBaselineValidator {
  rules: WarmupBaselineRule[];

  constructor(rules: WarmupBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupBaseline[]): Map<string, string[]> {
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

export function defaultWarmupBaselineValidator(): WarmupBaselineValidator {
  return new WarmupBaselineValidator(
    [
      new WarmupBaselineRequiredCodeRule("warmup baseline needs this field"),
      new WarmupBaselineCodePrefixRule("REF"),
      new WarmupBaselineCodeLengthRule(120),
      new WarmupBaselineRequiredNameRule("warmup baseline needs a value"),
      new WarmupBaselineNameLengthRule(3600),
    ],
  );
}
