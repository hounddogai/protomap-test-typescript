import * as text from "../../../../kit/text.js";

/** Where a mention notice is in its life cycle. */
export type MentionNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One mention notice, with what the planners need to act on it. */
export class MentionNotice {
  code: string;
  label: string;
  durationMinutes: number;
  audienceId: string;
  windowDays: number;
  timezone: string;
  status: MentionNoticeStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    audienceId: string,
    windowDays: number,
    timezone: string,
    status: MentionNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.audienceId = audienceId;
    this.windowDays = windowDays;
    this.timezone = timezone;
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

  canMoveTo(next: MentionNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: MentionNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"mention notice"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.durationMinutes * this.windowDays * 100) / 100;
  }

  copy(): MentionNotice {
    return new MentionNotice(
      this.code,
      this.label,
      this.durationMinutes,
      this.audienceId,
      this.windowDays,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a mention notice in status open. */
export function newMentionNotice(code: string, label: string): MentionNotice {
  return new MentionNotice(code, label, 0, "", 0, "", "open");
}
