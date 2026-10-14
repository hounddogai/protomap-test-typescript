import { TouchpointAgreement } from "./touchpoint-agreement.js";

/** A rule a touchpoint agreement must pass. Check returns its problems, or none. */
export interface TouchpointAgreementRule {
  check(item: TouchpointAgreement): string[];
}

export class TouchpointAgreementRequiredLabelRule implements TouchpointAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointAgreementRequiredCodeRule implements TouchpointAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointAgreementRequiredChecksumRule implements TouchpointAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointAgreement): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointAgreementPinnedGuardRule implements TouchpointAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TouchpointAgreement): string[] {
    if (item.pinned && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class TouchpointAgreementCodeLengthRule implements TouchpointAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a touchpoint agreement. */
export class TouchpointAgreementValidator {
  rules: TouchpointAgreementRule[];

  constructor(rules: TouchpointAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointAgreement[]): Map<string, string[]> {
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

export function defaultTouchpointAgreementValidator(): TouchpointAgreementValidator {
  return new TouchpointAgreementValidator(
    [
      new TouchpointAgreementRequiredLabelRule("touchpoint agreement needs this field"),
      new TouchpointAgreementRequiredCodeRule("touchpoint agreement needs an entry"),
      new TouchpointAgreementRequiredChecksumRule("touchpoint agreement needs a value"),
      new TouchpointAgreementPinnedGuardRule(2.1),
      new TouchpointAgreementCodeLengthRule(3600),
    ],
  );
}
