import * as text from "../../../../kit/text.js";

/** Where a sender request is in its life cycle. */
export type SenderRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a sender request and its current status. */
export class SenderRequest {
  code: string;
  title: string;
  clicks: number;
  sendAt: number;
  durationMinutes: number;
  ratio: number;
  contactEmail: string;
  budget: number;
  status: SenderRequestStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    sendAt: number,
    durationMinutes: number,
    ratio: number,
    contactEmail: string,
    budget: number,
    status: SenderRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.sendAt = sendAt;
    this.durationMinutes = durationMinutes;
    this.ratio = ratio;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SenderRequestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SenderRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedTotal(): number {
    return Math.round((this.sendAt - this.budget) * 100) / 100;
  }

  copy(): SenderRequest {
    return new SenderRequest(
      this.code,
      this.title,
      this.clicks,
      this.sendAt,
      this.durationMinutes,
      this.ratio,
      this.contactEmail,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sender request in status open. */
export function newSenderRequest(code: string, title: string): SenderRequest {
  return new SenderRequest(code, title, 0, 0, 0, 0, "", 0, "open");
}
