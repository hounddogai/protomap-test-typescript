import * as text from "../../../../kit/text.js";

/** Where a scheduled sender checkpoint is in its life cycle. */
export type ScheduledSenderCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled sender checkpoint as the sender team keeps it. */
export class ScheduledSenderCheckpoint {
  code: string;
  label: string;
  source: string;
  expiresAt: number;
  createdAt: number;
  locale: string;
  country: string;
  quantity: number;
  ceiling: number;
  status: ScheduledSenderCheckpointStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    expiresAt: number,
    createdAt: number,
    locale: string,
    country: string,
    quantity: number,
    ceiling: number,
    status: ScheduledSenderCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.locale = locale;
    this.country = country;
    this.quantity = quantity;
    this.ceiling = ceiling;
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

  canMoveTo(next: ScheduledSenderCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ScheduledSenderCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled sender checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedValue(): number {
    return Math.round((this.expiresAt + this.createdAt) * 100) / 100;
  }

  copy(): ScheduledSenderCheckpoint {
    return new ScheduledSenderCheckpoint(
      this.code,
      this.label,
      this.source,
      this.expiresAt,
      this.createdAt,
      this.locale,
      this.country,
      this.quantity,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled sender checkpoint in status planned. */
export function newScheduledSenderCheckpoint(code: string, label: string): ScheduledSenderCheckpoint {
  return new ScheduledSenderCheckpoint(code, label, "", 0, 0, "", "", 0, 0, "planned");
}
