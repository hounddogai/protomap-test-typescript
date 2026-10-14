import { JourneyTarget } from "./journey-target.js";

/** A rule a journey target must pass. Check returns its problems, or none. */
export interface JourneyTargetRule {
  check(item: JourneyTarget): string[];
}

export class JourneyTargetRequiredCountryRule implements JourneyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyTarget): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyTargetCountryLengthRule implements JourneyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyTarget): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyTargetRequiredNameRule implements JourneyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyTarget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyTargetRequiredCodeRule implements JourneyTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyTargetAmountRangeRule implements JourneyTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: JourneyTarget): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class JourneyTargetNameLengthRule implements JourneyTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a journey target. */
export class JourneyTargetValidator {
  rules: JourneyTargetRule[];

  constructor(rules: JourneyTargetRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyTarget[]): Map<string, string[]> {
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

export function defaultJourneyTargetValidator(): JourneyTargetValidator {
  return new JourneyTargetValidator(
    [
      new JourneyTargetRequiredCountryRule("journey target needs a value"),
      new JourneyTargetCountryLengthRule(80),
      new JourneyTargetRequiredNameRule("journey target needs an entry"),
      new JourneyTargetRequiredCodeRule("journey target needs a value"),
      new JourneyTargetAmountRangeRule(4.8, 987.5),
      new JourneyTargetNameLengthRule(3600),
    ],
  );
}
