import { TicketViewTemplate } from "./ticket-view-template.js";

/** A rule a ticket view template must pass. Check returns its problems, or none. */
export interface TicketViewTemplateRule {
  check(item: TicketViewTemplate): string[];
}

export class TicketViewTemplateRequiredCodeRule implements TicketViewTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TicketViewTemplateLimitRangeRule implements TicketViewTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewTemplate): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewTemplateUpdatedAtRangeRule implements TicketViewTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TicketViewTemplate): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TicketViewTemplateNameLengthRule implements TicketViewTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TicketViewTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TicketViewTemplateCodePrefixRule implements TicketViewTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TicketViewTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TicketViewTemplateRequiredSegmentRule implements TicketViewTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TicketViewTemplate): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a ticket view template. */
export class TicketViewTemplateValidator {
  rules: TicketViewTemplateRule[];

  constructor(rules: TicketViewTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: TicketViewTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TicketViewTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TicketViewTemplate[]): Map<string, string[]> {
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

export function defaultTicketViewTemplateValidator(): TicketViewTemplateValidator {
  return new TicketViewTemplateValidator(
    [
      new TicketViewTemplateRequiredCodeRule("ticket view template needs a value"),
      new TicketViewTemplateLimitRangeRule(16, 120),
      new TicketViewTemplateUpdatedAtRangeRule(120, 86400),
      new TicketViewTemplateNameLengthRule(3600),
      new TicketViewTemplateCodePrefixRule("ACM"),
      new TicketViewTemplateRequiredSegmentRule("ticket view template needs this field"),
    ],
  );
}
