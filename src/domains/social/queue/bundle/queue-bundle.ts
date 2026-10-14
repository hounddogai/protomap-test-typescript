/**
 * The queue bundle records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue bundle is in its life cycle. */
export type QueueBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A queue bundle. Its code is unique within a tenant. */
export class QueueBundle {
  code: string;
  title: string;
  summary: string;
  endsAt: number;
  version: number;
  utmSource: string;
  score: number;
  status: QueueBundleStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    endsAt: number,
    version: number,
    utmSource: string,
    score: number,
    status: QueueBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.endsAt = endsAt;
    this.version = version;
    this.utmSource = utmSource;
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

  canMoveTo(next: QueueBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.score + this.version) * 100) / 100;
  }

  copy(): QueueBundle {
    return new QueueBundle(
      this.code,
      this.title,
      this.summary,
      this.endsAt,
      this.version,
      this.utmSource,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a queue bundle in status draft. */
export function newQueueBundle(code: string, title: string): QueueBundle {
  return new QueueBundle(code, title, "", 0, 0, "", 0, "draft");
}
