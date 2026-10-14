import * as text from "../../../../kit/text.js";

/** Where a global wait batch is in its life cycle. */
export type GlobalWaitBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a global wait batch and its current status. */
export class GlobalWaitBatch {
  code: string;
  title: string;
  priority: number;
  tags: string[];
  visible: boolean;
  journeyId: string;
  approved: boolean;
  timezone: string;
  floorValue: number;
  discount: number;
  status: GlobalWaitBatchStatus;

  constructor(
    code: string,
    title: string,
    priority: number,
    tags: string[],
    visible: boolean,
    journeyId: string,
    approved: boolean,
    timezone: string,
    floorValue: number,
    discount: number,
    status: GlobalWaitBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.priority = priority;
    this.tags = tags;
    this.visible = visible;
    this.journeyId = journeyId;
    this.approved = approved;
    this.timezone = timezone;
    this.floorValue = floorValue;
    this.discount = discount;
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

  canMoveTo(next: GlobalWaitBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalWaitBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global wait batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.priority - this.floorValue) * 100) / 100;
  }

  copy(): GlobalWaitBatch {
    return new GlobalWaitBatch(
      this.code,
      this.title,
      this.priority,
      this.tags,
      this.visible,
      this.journeyId,
      this.approved,
      this.timezone,
      this.floorValue,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global wait batch in status new. */
export function newGlobalWaitBatch(code: string, title: string): GlobalWaitBatch {
  return new GlobalWaitBatch(code, title, 0, [], false, "", false, "", 0, 0, "new");
}
