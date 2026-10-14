import * as text from "../../../../kit/text.js";
import { ScheduledBidRuleForecast } from "./scheduled-bid-rule-forecast.js";

/** A rule a scheduled bid rule forecast must pass. Check returns its problems, or none. */
export interface ScheduledBidRuleForecastRule {
  check(item: ScheduledBidRuleForecast): string[];
}

export class ScheduledBidRuleForecastRequiredContactEmailRule implements ScheduledBidRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBidRuleForecast): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBidRuleForecastTitleLengthRule implements ScheduledBidRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledBidRuleForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledBidRuleForecastCodePrefixRule implements ScheduledBidRuleForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledBidRuleForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledBidRuleForecastRequiredOwnerIdRule implements ScheduledBidRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBidRuleForecast): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBidRuleForecastRequiredTitleRule implements ScheduledBidRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledBidRuleForecast): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledBidRuleForecastAllowedOwnerIdRule implements ScheduledBidRuleForecastRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledBidRuleForecast): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is expired`];
    return [];
  }
}

/** Runs every rule of a scheduled bid rule forecast. */
export class ScheduledBidRuleForecastValidator {
  rules: ScheduledBidRuleForecastRule[];

  constructor(rules: ScheduledBidRuleForecastRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledBidRuleForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledBidRuleForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledBidRuleForecast[]): Map<string, string[]> {
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

export function defaultScheduledBidRuleForecastValidator(): ScheduledBidRuleForecastValidator {
  return new ScheduledBidRuleForecastValidator(
    [
      new ScheduledBidRuleForecastRequiredContactEmailRule("scheduled bid rule forecast needs a value"),
      new ScheduledBidRuleForecastTitleLengthRule(3600),
      new ScheduledBidRuleForecastCodePrefixRule("ACM"),
      new ScheduledBidRuleForecastRequiredOwnerIdRule("scheduled bid rule forecast needs this field"),
      new ScheduledBidRuleForecastRequiredTitleRule("scheduled bid rule forecast needs this field"),
      new ScheduledBidRuleForecastAllowedOwnerIdRule(["manual"]),
    ],
  );
}
