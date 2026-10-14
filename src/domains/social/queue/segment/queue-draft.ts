import * as text from "../../../../kit/text.js";

/** Where a queue draft is in its life cycle. */
export type QueueDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A queue draft. Its code is unique within a tenant. */
export class QueueDraft {
  code: string;
  title: string;
  reviewer: string;
  weight: number;
  capacity: number;
  quantity: number;
  clicks: number;
  campaignRef: string;
  bid: number;
  status: QueueDraftStatus;

  constructor(
    code: string,
    title: string,
    reviewer: string,
    weight: number,
    capacity: number,
    quantity: number,
    clicks: number,
    campaignRef: string,
    bid: number,
    status: QueueDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.reviewer = reviewer;
    this.weight = weight;
    this.capacity = capacity;
    this.quantity = quantity;
    this.clicks = clicks;
    this.campaignRef = campaignRef;
    this.bid = bid;
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

  canMoveTo(next: QueueDraftStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
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

  moveTo(next: QueueDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedValue(): number {
    return Math.round(this.capacity * this.quantity * 100) / 100;
  }

  copy(): QueueDraft {
    return new QueueDraft(
      this.code,
      this.title,
      this.reviewer,
      this.weight,
      this.capacity,
      this.quantity,
      this.clicks,
      this.campaignRef,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a queue draft in status open. */
export function newQueueDraft(code: string, title: string): QueueDraft {
  return new QueueDraft(code, title, "", 0, 0, 0, 0, "", 0, "open");
}
