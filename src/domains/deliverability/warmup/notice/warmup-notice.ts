/**
 * The warmup notice records of deliverability's warmup work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup notice is in its life cycle. */
export type WarmupNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** One warmup notice, with what the planners need to act on it. */
export class WarmupNotice {
  code: string;
  name: string;
  maximum: number;
  limit: number;
  archived: boolean;
  priority: number;
  weight: number;
  status: WarmupNoticeStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    limit: number,
    archived: boolean,
    priority: number,
    weight: number,
    status: WarmupNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.limit = limit;
    this.archived = archived;
    this.priority = priority;
    this.weight = weight;
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

  canMoveTo(next: WarmupNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WarmupNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"warmup notice"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.limit * this.maximum * 100) / 100;
  }

  copy(): WarmupNotice {
    return new WarmupNotice(
      this.code,
      this.name,
      this.maximum,
      this.limit,
      this.archived,
      this.priority,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a warmup notice in status new. */
export function newWarmupNotice(code: string, name: string): WarmupNotice {
  return new WarmupNotice(code, name, 0, 0, false, 0, 0, "new");
}
