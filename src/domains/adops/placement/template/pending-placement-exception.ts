import * as text from "../../../../kit/text.js";

/** Where a pending placement exception is in its life cycle. */
export type PendingPlacementExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending placement exception as the placement team keeps it. */
export class PendingPlacementException {
  code: string;
  title: string;
  revision: number;
  endsAt: number;
  maximum: number;
  archived: boolean;
  graceDays: number;
  windowDays: number;
  createdAt: number;
  version: number;
  capacity: number;
  status: PendingPlacementExceptionStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    endsAt: number,
    maximum: number,
    archived: boolean,
    graceDays: number,
    windowDays: number,
    createdAt: number,
    version: number,
    capacity: number,
    status: PendingPlacementExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.endsAt = endsAt;
    this.maximum = maximum;
    this.archived = archived;
    this.graceDays = graceDays;
    this.windowDays = windowDays;
    this.createdAt = createdAt;
    this.version = version;
    this.capacity = capacity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingPlacementExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingPlacementExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending placement exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.createdAt - this.windowDays) * 100) / 100;
  }

  copy(): PendingPlacementException {
    return new PendingPlacementException(
      this.code,
      this.title,
      this.revision,
      this.endsAt,
      this.maximum,
      this.archived,
      this.graceDays,
      this.windowDays,
      this.createdAt,
      this.version,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pending placement exception in status requested. */
export function newPendingPlacementException(code: string, title: string): PendingPlacementException {
  return new PendingPlacementException(code, title, 0, 0, 0, false, 0, 0, 0, 0, 0, "requested");
}
