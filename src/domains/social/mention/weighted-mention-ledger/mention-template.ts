import * as text from "../../../../kit/text.js";

/** Where a mention template is in its life cycle. */
export type MentionTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A mention template. Its code is unique within a tenant. */
export class MentionTemplate {
  code: string;
  name: string;
  clicks: number;
  expiresAt: number;
  tags: string[];
  status: MentionTemplateStatus;

  constructor(
    code: string,
    name: string,
    clicks: number,
    expiresAt: number,
    tags: string[],
    status: MentionTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.clicks = clicks;
    this.expiresAt = expiresAt;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: MentionTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"mention template"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.clicks * this.expiresAt * 100) / 100;
  }

  copy(): MentionTemplate {
    return new MentionTemplate(this.code, this.name, this.clicks, this.expiresAt, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a mention template in status open. */
export function newMentionTemplate(code: string, name: string): MentionTemplate {
  return new MentionTemplate(code, name, 0, 0, [], "open");
}
