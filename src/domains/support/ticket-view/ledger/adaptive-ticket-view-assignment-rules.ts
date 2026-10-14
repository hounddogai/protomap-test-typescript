import { AdaptiveTicketViewAssignment } from "./adaptive-ticket-view-assignment.js";

/** A rule a adaptive ticket view assignment must pass. Check returns its problems, or none. */
export interface AdaptiveTicketViewAssignmentRule {
  check(item: AdaptiveTicketViewAssignment): string[];
}

export class AdaptiveTicketViewAssignmentCodePrefixRule implements AdaptiveTicketViewAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveTicketViewAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveTicketViewAssignmentRequiredDescriptionRule implements AdaptiveTicketViewAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTicketViewAssignment): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveTicketViewAssignmentRequiredReviewerRule implements AdaptiveTicketViewAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTicketViewAssignment): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveTicketViewAssignmentRequiredCodeRule implements AdaptiveTicketViewAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveTicketViewAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive ticket view assignment. */
export class AdaptiveTicketViewAssignmentValidator {
  rules: AdaptiveTicketViewAssignmentRule[];

  constructor(rules: AdaptiveTicketViewAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveTicketViewAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveTicketViewAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveTicketViewAssignment[]): Map<string, string[]> {
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

export function defaultAdaptiveTicketViewAssignmentValidator(): AdaptiveTicketViewAssignmentValidator {
  return new AdaptiveTicketViewAssignmentValidator(
    [
      new AdaptiveTicketViewAssignmentCodePrefixRule("ACM"),
      new AdaptiveTicketViewAssignmentRequiredDescriptionRule(
        "adaptive ticket view assignment needs this field",
      ),
      new AdaptiveTicketViewAssignmentRequiredReviewerRule("adaptive ticket view assignment needs an entry"),
      new AdaptiveTicketViewAssignmentRequiredCodeRule("adaptive ticket view assignment needs an entry"),
    ],
  );
}
