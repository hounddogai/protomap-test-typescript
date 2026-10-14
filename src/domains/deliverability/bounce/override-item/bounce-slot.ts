import * as text from "../../../../kit/text.js";

/** Where a bounce slot is in its life cycle. */
export type BounceSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One bounce slot, with what the planners need to act on it. */
export class BounceSlot {
  code: string;
  title: string;
  retries: number;
  reviewer: string;
  durationMinutes: number;
  ownerId: string;
  description: string;
  locale: string;
  status: BounceSlotStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    reviewer: string,
    durationMinutes: number,
    ownerId: string,
    description: string,
    locale: string,
    status: BounceSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.reviewer = reviewer;
    this.durationMinutes = durationMinutes;
    this.ownerId = ownerId;
    this.description = description;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedValue(): number {
    return Math.round((this.retries + this.durationMinutes) * 100) / 100;
  }

  copy(): BounceSlot {
    return new BounceSlot(
      this.code,
      this.title,
      this.retries,
      this.reviewer,
      this.durationMinutes,
      this.ownerId,
      this.description,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bounce slot in status proposed. */
export function newBounceSlot(code: string, title: string): BounceSlot {
  return new BounceSlot(code, title, 0, "", 0, "", "", "", "proposed");
}
