import * as text from "../../../../kit/text.js";

/** Where a ticket view batch is in its life cycle. */
export type TicketViewBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A ticket view batch as the ticket view team keeps it. */
export class TicketViewBatch {
  code: string;
  title: string;
  segment: string;
  batchSize: number;
  notes: string;
  ownerId: string;
  status: TicketViewBatchStatus;

  constructor(
    code: string,
    title: string,
    segment: string,
    batchSize: number,
    notes: string,
    ownerId: string,
    status: TicketViewBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.segment = segment;
    this.batchSize = batchSize;
    this.notes = notes;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TicketViewBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TicketViewBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): TicketViewBatch {
    return new TicketViewBatch(
      this.code,
      this.title,
      this.segment,
      this.batchSize,
      this.notes,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a ticket view batch in status draft. */
export function newTicketViewBatch(code: string, title: string): TicketViewBatch {
  return new TicketViewBatch(code, title, "", 0, "", "", "draft");
}
