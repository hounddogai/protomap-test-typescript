import { PrimaryFunnelOverride } from "./primary-funnel-override.js";

/** A rule a primary funnel override must pass. Check returns its problems, or none. */
export interface PrimaryFunnelOverrideRule {
  check(item: PrimaryFunnelOverride): string[];
}

export class PrimaryFunnelOverrideRequiredCodeRule implements PrimaryFunnelOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFunnelOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFunnelOverrideCodePrefixRule implements PrimaryFunnelOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryFunnelOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryFunnelOverrideRequiredExternalRefRule implements PrimaryFunnelOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFunnelOverride): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryFunnelOverrideUnitLengthRule implements PrimaryFunnelOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFunnelOverride): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary funnel override. */
export class PrimaryFunnelOverrideValidator {
  rules: PrimaryFunnelOverrideRule[];

  constructor(rules: PrimaryFunnelOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFunnelOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryFunnelOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFunnelOverride[]): Map<string, string[]> {
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

export function defaultPrimaryFunnelOverrideValidator(): PrimaryFunnelOverrideValidator {
  return new PrimaryFunnelOverrideValidator(
    [
      new PrimaryFunnelOverrideRequiredCodeRule("primary funnel override needs an entry"),
      new PrimaryFunnelOverrideCodePrefixRule("X"),
      new PrimaryFunnelOverrideRequiredExternalRefRule("primary funnel override needs an entry"),
      new PrimaryFunnelOverrideUnitLengthRule(1000),
    ],
  );
}
