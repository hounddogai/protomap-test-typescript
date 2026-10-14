import { SeasonalTicketViewAssignment } from "./seasonal-ticket-view-assignment.js";

/** A rule a seasonal ticket view assignment must pass. Check returns its problems, or none. */
export interface SeasonalTicketViewAssignmentRule {
  check(item: SeasonalTicketViewAssignment): string[];
}

export class SeasonalTicketViewAssignmentLocaleLengthRule implements SeasonalTicketViewAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTicketViewAssignment): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTicketViewAssignmentCodePrefixRule implements SeasonalTicketViewAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalTicketViewAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalTicketViewAssignmentTitleLengthRule implements SeasonalTicketViewAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTicketViewAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTicketViewAssignmentCodeLengthRule implements SeasonalTicketViewAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalTicketViewAssignment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalTicketViewAssignmentRequiredCodeRule implements SeasonalTicketViewAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalTicketViewAssignment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal ticket view assignment. */
export class SeasonalTicketViewAssignmentValidator {
  rules: SeasonalTicketViewAssignmentRule[];

  constructor(rules: SeasonalTicketViewAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalTicketViewAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalTicketViewAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalTicketViewAssignment[]): Map<string, string[]> {
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

export function defaultSeasonalTicketViewAssignmentValidator(): SeasonalTicketViewAssignmentValidator {
  return new SeasonalTicketViewAssignmentValidator(
    [
      new SeasonalTicketViewAssignmentLocaleLengthRule(16),
      new SeasonalTicketViewAssignmentCodePrefixRule("REF"),
      new SeasonalTicketViewAssignmentTitleLengthRule(255),
      new SeasonalTicketViewAssignmentCodeLengthRule(1000),
      new SeasonalTicketViewAssignmentRequiredCodeRule("seasonal ticket view assignment needs a value"),
    ],
  );
}
