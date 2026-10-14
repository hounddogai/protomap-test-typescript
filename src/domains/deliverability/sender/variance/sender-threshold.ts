import * as text from "../../../../kit/text.js";

/** Where a sender threshold is in its life cycle. */
export type SenderThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a sender threshold and its current status. */
export class SenderThreshold {
  code: string;
  title: string;
  region: string;
  clicks: number;
  ratio: number;
  weight: number;
  status: SenderThresholdStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    clicks: number,
    ratio: number,
    weight: number,
    status: SenderThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.clicks = clicks;
    this.ratio = ratio;
    this.weight = weight;
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

  canMoveTo(next: SenderThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round((this.ratio + this.clicks) * 100) / 100;
  }

  copy(): SenderThreshold {
    return new SenderThreshold(this.code, this.title, this.region, this.clicks, this.ratio, this.weight, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a sender threshold in status draft. */
export function newSenderThreshold(code: string, title: string): SenderThreshold {
  return new SenderThreshold(code, title, "", 0, 0, 0, "draft");
}
