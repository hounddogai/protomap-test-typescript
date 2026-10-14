import { SlaBaseline } from "./sla-baseline.js";

/** A rule a sla baseline must pass. Check returns its problems, or none. */
export interface SlaBaselineRule {
  check(item: SlaBaseline): string[];
}

export class SlaBaselineNameLengthRule implements SlaBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaBaseline): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaBaselineRequiredCodeRule implements SlaBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SlaBaselineRequiredNameRule implements SlaBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaBaseline): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SlaBaselineCodeLengthRule implements SlaBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaBaselineRequiredChannelRule implements SlaBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaBaseline): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SlaBaselineUtmSourceLengthRule implements SlaBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaBaseline): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla baseline. */
export class SlaBaselineValidator {
  rules: SlaBaselineRule[];

  constructor(rules: SlaBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: SlaBaseline): string[] {
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

  requireValid(item: SlaBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaBaseline[]): Map<string, string[]> {
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

export function defaultSlaBaselineValidator(): SlaBaselineValidator {
  return new SlaBaselineValidator(
    [
      new SlaBaselineNameLengthRule(1000),
      new SlaBaselineRequiredCodeRule("sla baseline needs this field"),
      new SlaBaselineRequiredNameRule("sla baseline needs an entry"),
      new SlaBaselineCodeLengthRule(3600),
      new SlaBaselineRequiredChannelRule("sla baseline needs this field"),
      new SlaBaselineUtmSourceLengthRule(16),
    ],
  );
}
