import { SlaPolicy } from "./sla-policy.js";

/** A rule a sla policy must pass. Check returns its problems, or none. */
export interface SlaPolicyRule {
  check(item: SlaPolicy): string[];
}

export class SlaPolicyRequiredLocaleRule implements SlaPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaPolicy): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SlaPolicyDescriptionLengthRule implements SlaPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaPolicy): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaPolicyRequiredCodeRule implements SlaPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a sla policy. */
export class SlaPolicyValidator {
  rules: SlaPolicyRule[];

  constructor(rules: SlaPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: SlaPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaPolicy[]): Map<string, string[]> {
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

export function defaultSlaPolicyValidator(): SlaPolicyValidator {
  return new SlaPolicyValidator(
    [
      new SlaPolicyRequiredLocaleRule("sla policy needs a value"),
      new SlaPolicyDescriptionLengthRule(64),
      new SlaPolicyRequiredCodeRule("sla policy needs an entry"),
    ],
  );
}
