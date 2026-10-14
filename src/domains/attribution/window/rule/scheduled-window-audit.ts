import * as text from "../../../../kit/text.js";

/** Where a scheduled window audit is in its life cycle. */
export type ScheduledWindowAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One scheduled window audit, with what the planners need to act on it. */
export class ScheduledWindowAudit {
  code: string;
  title: string;
  source: string;
  segment: string;
  tags: string[];
  active: boolean;
  score: number;
  status: ScheduledWindowAuditStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    segment: string,
    tags: string[],
    active: boolean,
    score: number,
    status: ScheduledWindowAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.segment = segment;
    this.tags = tags;
    this.active = active;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledWindowAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledWindowAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled window audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  measuredValue(): number {
    return this.score;
  }

  copy(): ScheduledWindowAudit {
    return new ScheduledWindowAudit(
      this.code,
      this.title,
      this.source,
      this.segment,
      this.tags,
      this.active,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled window audit in status draft. */
export function newScheduledWindowAudit(code: string, title: string): ScheduledWindowAudit {
  return new ScheduledWindowAudit(code, title, "", "", [], false, 0, "draft");
}
