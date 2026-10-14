import * as text from "../../../../kit/text.js";

/** Where a pending reply reservation is in its life cycle. */
export type PendingReplyReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending reply reservation as the reply team keeps it. */
export class PendingReplyReservation {
  code: string;
  name: string;
  weight: number;
  checksum: string;
  audienceId: string;
  archived: boolean;
  batchSize: number;
  status: PendingReplyReservationStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    checksum: string,
    audienceId: string,
    archived: boolean,
    batchSize: number,
    status: PendingReplyReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.checksum = checksum;
    this.audienceId = audienceId;
    this.archived = archived;
    this.batchSize = batchSize;
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

  canMoveTo(next: PendingReplyReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PendingReplyReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reply reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.weight + this.batchSize) * 100) / 100;
  }

  copy(): PendingReplyReservation {
    return new PendingReplyReservation(
      this.code,
      this.name,
      this.weight,
      this.checksum,
      this.audienceId,
      this.archived,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pending reply reservation in status idle. */
export function newPendingReplyReservation(code: string, name: string): PendingReplyReservation {
  return new PendingReplyReservation(code, name, 0, "", "", false, 0, "idle");
}
