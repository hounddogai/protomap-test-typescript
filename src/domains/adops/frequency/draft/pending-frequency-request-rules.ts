import * as text from "../../../../kit/text.js";
import { PendingFrequencyRequest } from "./pending-frequency-request.js";

/** A rule a pending frequency request must pass. Check returns its problems, or none. */
export interface PendingFrequencyRequestRule {
  check(item: PendingFrequencyRequest): string[];
}

export class PendingFrequencyRequestCodePrefixRule implements PendingFrequencyRequestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingFrequencyRequest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingFrequencyRequestRequiredChannelRule implements PendingFrequencyRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFrequencyRequest): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFrequencyRequestChannelLengthRule implements PendingFrequencyRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyRequest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFrequencyRequestSourceLengthRule implements PendingFrequencyRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyRequest): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFrequencyRequestCodeLengthRule implements PendingFrequencyRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyRequest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFrequencyRequestAllowedSourceRule implements PendingFrequencyRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingFrequencyRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is out of range`];
    return [];
  }
}

/** Runs every rule of a pending frequency request. */
export class PendingFrequencyRequestValidator {
  rules: PendingFrequencyRequestRule[];

  constructor(rules: PendingFrequencyRequestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFrequencyRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingFrequencyRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFrequencyRequest[]): Map<string, string[]> {
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

export function defaultPendingFrequencyRequestValidator(): PendingFrequencyRequestValidator {
  return new PendingFrequencyRequestValidator(
    [
      new PendingFrequencyRequestCodePrefixRule("REF"),
      new PendingFrequencyRequestRequiredChannelRule("pending frequency request needs a value"),
      new PendingFrequencyRequestChannelLengthRule(1000),
      new PendingFrequencyRequestSourceLengthRule(255),
      new PendingFrequencyRequestCodeLengthRule(120),
      new PendingFrequencyRequestAllowedSourceRule(["batched"]),
    ],
  );
}
