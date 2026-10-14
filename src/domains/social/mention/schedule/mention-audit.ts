import * as text from "../../../../kit/text.js";

/** Where a mention audit is in its life cycle. */
export type MentionAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One mention audit, with what the planners need to act on it. */
export class MentionAudit {
  code: string;
  label: string;
  priority: number;
  audienceId: string;
  variant: string;
  visible: boolean;
  journeyId: string;
  summary: string;
  status: MentionAuditStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    audienceId: string,
    variant: string,
    visible: boolean,
    journeyId: string,
    summary: string,
    status: MentionAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.audienceId = audienceId;
    this.variant = variant;
    this.visible = visible;
    this.journeyId = journeyId;
    this.summary = summary;
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

  canMoveTo(next: MentionAuditStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): MentionAudit {
    return new MentionAudit(
      this.code,
      this.label,
      this.priority,
      this.audienceId,
      this.variant,
      this.visible,
      this.journeyId,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a mention audit in status open. */
export function newMentionAudit(code: string, label: string): MentionAudit {
  return new MentionAudit(code, label, 0, "", "", false, "", "", "open");
}
