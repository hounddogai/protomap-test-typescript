import * as text from "../../../../kit/text.js";

/** Where a manual bounce exception is in its life cycle. */
export type ManualBounceExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual bounce exception as the bounce team keeps it. */
export class ManualBounceException {
  code: string;
  title: string;
  floorValue: number;
  clicks: number;
  sequence: number;
  source: string;
  revision: number;
  quantity: number;
  status: ManualBounceExceptionStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    clicks: number,
    sequence: number,
    source: string,
    revision: number,
    quantity: number,
    status: ManualBounceExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.clicks = clicks;
    this.sequence = sequence;
    this.source = source;
    this.revision = revision;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualBounceExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ManualBounceExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual bounce exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"manual bounce exception"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.floorValue + this.clicks) * 100) / 100;
  }

  copy(): ManualBounceException {
    return new ManualBounceException(
      this.code,
      this.title,
      this.floorValue,
      this.clicks,
      this.sequence,
      this.source,
      this.revision,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a manual bounce exception in status idle. */
export function newManualBounceException(code: string, title: string): ManualBounceException {
  return new ManualBounceException(code, title, 0, 0, 0, "", 0, 0, "idle");
}
