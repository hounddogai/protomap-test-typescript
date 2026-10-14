import { PrimarySlaPlan } from "./primary-sla-plan.js";

/** A rule a primary sla plan must pass. Check returns its problems, or none. */
export interface PrimarySlaPlanRule {
  check(item: PrimarySlaPlan): string[];
}

export class PrimarySlaPlanRequiredCodeRule implements PrimarySlaPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySlaPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySlaPlanCodePrefixRule implements PrimarySlaPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimarySlaPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimarySlaPlanRequiredNameRule implements PrimarySlaPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySlaPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary sla plan. */
export class PrimarySlaPlanValidator {
  rules: PrimarySlaPlanRule[];

  constructor(rules: PrimarySlaPlanRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySlaPlan): string[] {
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

  requireValid(item: PrimarySlaPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySlaPlan[]): Map<string, string[]> {
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

export function defaultPrimarySlaPlanValidator(): PrimarySlaPlanValidator {
  return new PrimarySlaPlanValidator(
    [
      new PrimarySlaPlanRequiredCodeRule("primary sla plan needs this field"),
      new PrimarySlaPlanCodePrefixRule("X"),
      new PrimarySlaPlanRequiredNameRule("primary sla plan needs a value"),
    ],
  );
}
