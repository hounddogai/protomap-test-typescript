import * as text from "../../../../kit/text.js";

/** Where a lenient approval checkpoint is in its life cycle. */
export type LenientApprovalCheckpointStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One lenient approval checkpoint, with what the planners need to act on it. */
export class LenientApprovalCheckpoint {
  code: string;
  name: string;
  category: string;
  archived: boolean;
  timezone: string;
  minimum: number;
  checksum: string;
  sendAt: number;
  discount: number;
  locale: string;
  status: LenientApprovalCheckpointStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    archived: boolean,
    timezone: string,
    minimum: number,
    checksum: string,
    sendAt: number,
    discount: number,
    locale: string,
    status: LenientApprovalCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.archived = archived;
    this.timezone = timezone;
    this.minimum = minimum;
    this.checksum = checksum;
    this.sendAt = sendAt;
    this.discount = discount;
    this.locale = locale;
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

  canMoveTo(next: LenientApprovalCheckpointStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LenientApprovalCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient approval checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round((this.discount - this.sendAt) * 100) / 100;
  }

  copy(): LenientApprovalCheckpoint {
    return new LenientApprovalCheckpoint(
      this.code,
      this.name,
      this.category,
      this.archived,
      this.timezone,
      this.minimum,
      this.checksum,
      this.sendAt,
      this.discount,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a lenient approval checkpoint in status planned. */
export function newLenientApprovalCheckpoint(code: string, name: string): LenientApprovalCheckpoint {
  return new LenientApprovalCheckpoint(code, name, "", false, "", 0, "", 0, 0, "", "planned");
}
