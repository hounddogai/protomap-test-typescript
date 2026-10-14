import * as text from "../../../../kit/text.js";

/** Where a queue claim is in its life cycle. */
export type QueueClaimStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One queue claim, with what the planners need to act on it. */
export class QueueClaim {
  code: string;
  title: string;
  segment: string;
  locale: string;
  active: boolean;
  archived: boolean;
  updatedAt: number;
  pinned: boolean;
  createdAt: number;
  expiresAt: number;
  cohort: string;
  status: QueueClaimStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    locale: string,
    active: boolean,
    archived: boolean,
    updatedAt: number,
    pinned: boolean,
    createdAt: number,
    expiresAt: number,
    cohort: string,
    status: QueueClaimStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.locale = locale;
    this.active = active;
    this.archived = archived;
    this.updatedAt = updatedAt;
    this.pinned = pinned;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.cohort = cohort;
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

  canMoveTo(next: QueueClaimStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueClaimStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue claim ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"queue claim"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.updatedAt - this.expiresAt) * 100) / 100;
  }

  copy(): QueueClaim {
    return new QueueClaim(
      this.code,
      this.title,
      this.segment,
      this.locale,
      this.active,
      this.archived,
      this.updatedAt,
      this.pinned,
      this.createdAt,
      this.expiresAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a queue claim in status planned. */
export function newQueueClaim(code: string, title: string): QueueClaim {
  return new QueueClaim(code, title, "", "", false, false, 0, false, 0, 0, "", "planned");
}
