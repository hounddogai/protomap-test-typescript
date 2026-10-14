import * as text from "../../../../kit/text.js";

/** Where a invite request is in its life cycle. */
export type InviteRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A invite request. Its code is unique within a tenant. */
export class InviteRequest {
  code: string;
  title: string;
  threshold: number;
  quantity: number;
  maximum: number;
  externalRef: string;
  attempts: number;
  bid: number;
  status: InviteRequestStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    quantity: number,
    maximum: number,
    externalRef: string,
    attempts: number,
    bid: number,
    status: InviteRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.quantity = quantity;
    this.maximum = maximum;
    this.externalRef = externalRef;
    this.attempts = attempts;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: InviteRequestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.threshold - this.attempts) * 100) / 100;
  }

  copy(): InviteRequest {
    return new InviteRequest(
      this.code,
      this.title,
      this.threshold,
      this.quantity,
      this.maximum,
      this.externalRef,
      this.attempts,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a invite request in status new. */
export function newInviteRequest(code: string, title: string): InviteRequest {
  return new InviteRequest(code, title, 0, 0, 0, "", 0, 0, "new");
}
