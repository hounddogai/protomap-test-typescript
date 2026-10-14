import * as text from "../../../../kit/text.js";
import { EscalationRequest } from "./escalation-request.js";

/** A rule a escalation request must pass. Check returns its problems, or none. */
export interface EscalationRequestRule {
  check(item: EscalationRequest): string[];
}

export class EscalationRequestEndsAtRangeRule implements EscalationRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationRequest): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationRequestAllowedTitleRule implements EscalationRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

export class EscalationRequestRequiredPhoneRule implements EscalationRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationRequest): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationRequestCodeLengthRule implements EscalationRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationRequestAttemptsRangeRule implements EscalationRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationRequest): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a escalation request. */
export class EscalationRequestValidator {
  rules: EscalationRequestRule[];

  constructor(rules: EscalationRequestRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationRequest[]): Map<string, string[]> {
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

export function defaultEscalationRequestValidator(): EscalationRequestValidator {
  return new EscalationRequestValidator(
    [
      new EscalationRequestEndsAtRangeRule(64, 80),
      new EscalationRequestAllowedTitleRule(["scheduled"]),
      new EscalationRequestRequiredPhoneRule("escalation request needs an entry"),
      new EscalationRequestCodeLengthRule(86400),
      new EscalationRequestAttemptsRangeRule(32, 120),
    ],
  );
}
