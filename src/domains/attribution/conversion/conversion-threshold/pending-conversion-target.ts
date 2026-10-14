import * as text from "../../../../kit/text.js";

/** Where a pending conversion target is in its life cycle. */
export type PendingConversionTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A pending conversion target as the conversion team keeps it. */
export class PendingConversionTarget {
  code: string;
  title: string;
  channel: string;
  checksum: string;
  ratio: number;
  clicks: number;
  batchSize: number;
  startsAt: number;
  status: PendingConversionTargetStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    checksum: string,
    ratio: number,
    clicks: number,
    batchSize: number,
    startsAt: number,
    status: PendingConversionTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.checksum = checksum;
    this.ratio = ratio;
    this.clicks = clicks;
    this.batchSize = batchSize;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingConversionTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PendingConversionTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending conversion target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedVolume(): number {
    return Math.round(this.startsAt * this.clicks * 100) / 100;
  }

  copy(): PendingConversionTarget {
    return new PendingConversionTarget(
      this.code,
      this.title,
      this.channel,
      this.checksum,
      this.ratio,
      this.clicks,
      this.batchSize,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending conversion target in status planned. */
export function newPendingConversionTarget(code: string, title: string): PendingConversionTarget {
  return new PendingConversionTarget(code, title, "", "", 0, 0, 0, 0, "planned");
}
