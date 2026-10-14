import { PendingNudgeTemplate } from "./pending-nudge-template.js";

/** A rule a pending nudge template must pass. Check returns its problems, or none. */
export interface PendingNudgeTemplateRule {
  check(item: PendingNudgeTemplate): string[];
}

export class PendingNudgeTemplateAudienceIdLengthRule implements PendingNudgeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingNudgeTemplate): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingNudgeTemplateCodePrefixRule implements PendingNudgeTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingNudgeTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingNudgeTemplateRequiredCodeRule implements PendingNudgeTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingNudgeTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingNudgeTemplateTitleLengthRule implements PendingNudgeTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingNudgeTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending nudge template. */
export class PendingNudgeTemplateValidator {
  rules: PendingNudgeTemplateRule[];

  constructor(rules: PendingNudgeTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PendingNudgeTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: PendingNudgeTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingNudgeTemplate[]): Map<string, string[]> {
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

export function defaultPendingNudgeTemplateValidator(): PendingNudgeTemplateValidator {
  return new PendingNudgeTemplateValidator(
    [
      new PendingNudgeTemplateAudienceIdLengthRule(255),
      new PendingNudgeTemplateCodePrefixRule("OPS"),
      new PendingNudgeTemplateRequiredCodeRule("pending nudge template needs a value"),
      new PendingNudgeTemplateTitleLengthRule(32),
    ],
  );
}
