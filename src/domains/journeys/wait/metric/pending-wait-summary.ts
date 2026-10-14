import * as text from "../../../../kit/text.js";

/** Where a pending wait summary is in its life cycle. */
export type PendingWaitSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** One pending wait summary, with what the planners need to act on it. */
export class PendingWaitSummary {
  code: string;
  title: string;
  pinned: boolean;
  tags: string[];
  name: string;
  priority: number;
  ownerId: string;
  status: PendingWaitSummaryStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    tags: string[],
    name: string,
    priority: number,
    ownerId: string,
    status: PendingWaitSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.tags = tags;
    this.name = name;
    this.priority = priority;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingWaitSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingWaitSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending wait summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.priority;
  }

  copy(): PendingWaitSummary {
    return new PendingWaitSummary(
      this.code,
      this.title,
      this.pinned,
      this.tags,
      this.name,
      this.priority,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending wait summary in status new. */
export function newPendingWaitSummary(code: string, title: string): PendingWaitSummary {
  return new PendingWaitSummary(code, title, false, [], "", 0, "", "new");
}
