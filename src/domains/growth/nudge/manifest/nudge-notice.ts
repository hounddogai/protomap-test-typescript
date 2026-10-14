import * as text from "../../../../kit/text.js";

/** Where a nudge notice is in its life cycle. */
export type NudgeNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One nudge notice, with what the planners need to act on it. */
export class NudgeNotice {
  code: string;
  title: string;
  priority: number;
  minimum: number;
  threshold: number;
  startsAt: number;
  tags: string[];
  margin: number;
  name: string;
  status: NudgeNoticeStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    minimum: number,
    threshold: number,
    startsAt: number,
    tags: string[],
    margin: number,
    name: string,
    status: NudgeNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.minimum = minimum;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.tags = tags;
    this.margin = margin;
    this.name = name;
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

  canMoveTo(next: NudgeNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: NudgeNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round(this.startsAt * this.threshold * 100) / 100;
  }

  copy(): NudgeNotice {
    return new NudgeNotice(
      this.code,
      this.title,
      this.priority,
      this.minimum,
      this.threshold,
      this.startsAt,
      this.tags,
      this.margin,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a nudge notice in status open. */
export function newNudgeNotice(code: string, title: string): NudgeNotice {
  return new NudgeNotice(code, title, 0, 0, 0, 0, [], 0, "", "open");
}
