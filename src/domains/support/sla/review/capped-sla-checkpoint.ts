import * as text from "../../../../kit/text.js";

/** Where a capped sla checkpoint is in its life cycle. */
export type CappedSlaCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A capped sla checkpoint. Its code is unique within a tenant. */
export class CappedSlaCheckpoint {
  code: string;
  title: string;
  variant: string;
  locale: string;
  quantity: number;
  durationMinutes: number;
  status: CappedSlaCheckpointStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    locale: string,
    quantity: number,
    durationMinutes: number,
    status: CappedSlaCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.locale = locale;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: CappedSlaCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedSlaCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped sla checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round((this.durationMinutes - this.quantity) * 100) / 100;
  }

  copy(): CappedSlaCheckpoint {
    return new CappedSlaCheckpoint(
      this.code,
      this.title,
      this.variant,
      this.locale,
      this.quantity,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped sla checkpoint in status planned. */
export function newCappedSlaCheckpoint(code: string, title: string): CappedSlaCheckpoint {
  return new CappedSlaCheckpoint(code, title, "", "", 0, 0, "planned");
}
