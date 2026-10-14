import { PostDraft } from "./post-draft.js";

/** A rule a post draft must pass. Check returns its problems, or none. */
export interface PostDraftRule {
  check(item: PostDraft): string[];
}

export class PostDraftCodeLengthRule implements PostDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostDraftNameLengthRule implements PostDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostDraftRequiredNotesRule implements PostDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostDraft): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PostDraftLocaleLengthRule implements PostDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostDraft): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostDraftNotesLengthRule implements PostDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostDraft): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostDraftCodePrefixRule implements PostDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a post draft. */
export class PostDraftValidator {
  rules: PostDraftRule[];

  constructor(rules: PostDraftRule[]) {
    this.rules = rules;
  }

  validate(item: PostDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostDraft[]): Map<string, string[]> {
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

export function defaultPostDraftValidator(): PostDraftValidator {
  return new PostDraftValidator(
    [
      new PostDraftCodeLengthRule(64),
      new PostDraftNameLengthRule(32),
      new PostDraftRequiredNotesRule("post draft needs this field"),
      new PostDraftLocaleLengthRule(80),
      new PostDraftNotesLengthRule(64),
      new PostDraftCodePrefixRule("Q"),
    ],
  );
}
