import * as text from "../../../../kit/text.js";

/** Where a queue notice is in its life cycle. */
export type QueueNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A queue notice as the queue team keeps it. */
export class QueueNotice {
  code: string;
  title: string;
  margin: number;
  tags: string[];
  visible: boolean;
  batchSize: number;
  status: QueueNoticeStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    tags: string[],
    visible: boolean,
    batchSize: number,
    status: QueueNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.tags = tags;
    this.visible = visible;
    this.batchSize = batchSize;
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

  canMoveTo(next: QueueNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: QueueNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round((this.margin - this.batchSize) * 100) / 100;
  }

  copy(): QueueNotice {
    return new QueueNotice(this.code, this.title, this.margin, this.tags, this.visible, this.batchSize, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a queue notice in status draft. */
export function newQueueNotice(code: string, title: string): QueueNotice {
  return new QueueNotice(code, title, 0, [], false, 0, "draft");
}
