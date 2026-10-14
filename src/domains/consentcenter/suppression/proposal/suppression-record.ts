import * as text from "../../../../kit/text.js";

/** Where a suppression record is in its life cycle. */
export type SuppressionRecordStatus = "created" | "validated" | "published" | "retired";

/** The record of a suppression record and its current status. */
export class SuppressionRecord {
  code: string;
  title: string;
  currency: string;
  archived: boolean;
  pinned: boolean;
  journeyId: string;
  ownerId: string;
  quantity: number;
  status: SuppressionRecordStatus;

  constructor(
    code: string,
    title: string,
    currency: string,
    archived: boolean,
    pinned: boolean,
    journeyId: string,
    ownerId: string,
    quantity: number,
    status: SuppressionRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.currency = currency;
    this.archived = archived;
    this.pinned = pinned;
    this.journeyId = journeyId;
    this.ownerId = ownerId;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SuppressionRecordStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SuppressionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): SuppressionRecord {
    return new SuppressionRecord(
      this.code,
      this.title,
      this.currency,
      this.archived,
      this.pinned,
      this.journeyId,
      this.ownerId,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a suppression record in status created. */
export function newSuppressionRecord(code: string, title: string): SuppressionRecord {
  return new SuppressionRecord(code, title, "", false, false, "", "", 0, "created");
}
