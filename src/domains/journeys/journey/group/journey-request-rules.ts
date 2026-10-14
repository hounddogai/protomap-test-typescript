import { JourneyRequest } from "./journey-request.js";

/** A rule a journey request must pass. Check returns its problems, or none. */
export interface JourneyRequestRule {
  check(item: JourneyRequest): string[];
}

export class JourneyRequestRequiredAudienceIdRule implements JourneyRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRequest): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyRequestRequiredCodeRule implements JourneyRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyRequestNameLengthRule implements JourneyRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: JourneyRequest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class JourneyRequestRequiredPhoneRule implements JourneyRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRequest): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyRequestRequiredNameRule implements JourneyRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey request. */
export class JourneyRequestValidator {
  rules: JourneyRequestRule[];

  constructor(rules: JourneyRequestRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: JourneyRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyRequest[]): Map<string, string[]> {
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

export function defaultJourneyRequestValidator(): JourneyRequestValidator {
  return new JourneyRequestValidator(
    [
      new JourneyRequestRequiredAudienceIdRule("journey request needs an entry"),
      new JourneyRequestRequiredCodeRule("journey request needs an entry"),
      new JourneyRequestNameLengthRule(255),
      new JourneyRequestRequiredPhoneRule("journey request needs a value"),
      new JourneyRequestRequiredNameRule("journey request needs an entry"),
    ],
  );
}
