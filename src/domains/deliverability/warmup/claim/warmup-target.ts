import * as text from "../../../../kit/text.js";

/** Where a warmup target is in its life cycle. */
export type WarmupTargetStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a warmup target and its current status. */
export class WarmupTarget {
  code: string;
  title: string;
  attempts: number;
  reviewer: string;
  quantity: number;
  campaignRef: string;
  category: string;
  region: string;
  source: string;
  retries: number;
  sendAt: number;
  status: WarmupTargetStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    reviewer: string,
    quantity: number,
    campaignRef: string,
    category: string,
    region: string,
    source: string,
    retries: number,
    sendAt: number,
    status: WarmupTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.category = category;
    this.region = region;
    this.source = source;
    this.retries = retries;
    this.sendAt = sendAt;
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

  canMoveTo(next: WarmupTargetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WarmupTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.quantity * this.attempts * 100) / 100;
  }

  copy(): WarmupTarget {
    return new WarmupTarget(
      this.code,
      this.title,
      this.attempts,
      this.reviewer,
      this.quantity,
      this.campaignRef,
      this.category,
      this.region,
      this.source,
      this.retries,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a warmup target in status new. */
export function newWarmupTarget(code: string, title: string): WarmupTarget {
  return new WarmupTarget(code, title, 0, "", 0, "", "", "", "", 0, 0, "new");
}
