import * as text from "../../../../kit/text.js";

/** Where a manual exit rule draft is in its life cycle. */
export type ManualExitRuleDraftStatus = "created" | "validated" | "published" | "retired";

/** A manual exit rule draft. Its code is unique within a tenant. */
export class ManualExitRuleDraft {
  code: string;
  title: string;
  contactEmail: string;
  minimum: number;
  capacity: number;
  quantity: number;
  batchSize: number;
  sendAt: number;
  margin: number;
  status: ManualExitRuleDraftStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    minimum: number,
    capacity: number,
    quantity: number,
    batchSize: number,
    sendAt: number,
    margin: number,
    status: ManualExitRuleDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.minimum = minimum;
    this.capacity = capacity;
    this.quantity = quantity;
    this.batchSize = batchSize;
    this.sendAt = sendAt;
    this.margin = margin;
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

  canMoveTo(next: ManualExitRuleDraftStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
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

  moveTo(next: ManualExitRuleDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual exit rule draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netExposure(): number {
    return Math.round((this.capacity + this.quantity) * 100) / 100;
  }

  copy(): ManualExitRuleDraft {
    return new ManualExitRuleDraft(
      this.code,
      this.title,
      this.contactEmail,
      this.minimum,
      this.capacity,
      this.quantity,
      this.batchSize,
      this.sendAt,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a manual exit rule draft in status created. */
export function newManualExitRuleDraft(code: string, title: string): ManualExitRuleDraft {
  return new ManualExitRuleDraft(code, title, "", 0, 0, 0, 0, 0, 0, "created");
}
