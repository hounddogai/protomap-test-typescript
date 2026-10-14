import { CappedSlaTarget } from "./capped-sla-target.js";

/** A rule a capped sla target must pass. Check returns its problems, or none. */
export interface CappedSlaTargetRule {
  check(item: CappedSlaTarget): string[];
}

export class CappedSlaTargetNameLengthRule implements CappedSlaTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSlaTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSlaTargetCodePrefixRule implements CappedSlaTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedSlaTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedSlaTargetRequiredLocaleRule implements CappedSlaTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSlaTarget): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped sla target. */
export class CappedSlaTargetValidator {
  rules: CappedSlaTargetRule[];

  constructor(rules: CappedSlaTargetRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSlaTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedSlaTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSlaTarget[]): Map<string, string[]> {
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

export function defaultCappedSlaTargetValidator(): CappedSlaTargetValidator {
  return new CappedSlaTargetValidator(
    [
      new CappedSlaTargetNameLengthRule(64),
      new CappedSlaTargetCodePrefixRule("Q"),
      new CappedSlaTargetRequiredLocaleRule("capped sla target needs an entry"),
    ],
  );
}
