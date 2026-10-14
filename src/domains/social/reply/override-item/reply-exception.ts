import * as text from "../../../../kit/text.js";

/** Where a reply exception is in its life cycle. */
export type ReplyExceptionStatus = "created" | "validated" | "published" | "retired";

/** The record of a reply exception and its current status. */
export class ReplyException {
  code: string;
  label: string;
  ownerId: string;
  endsAt: number;
  summary: string;
  cost: number;
  category: string;
  locale: string;
  checksum: string;
  frequencyCap: number;
  title: string;
  status: ReplyExceptionStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    endsAt: number,
    summary: string,
    cost: number,
    category: string,
    locale: string,
    checksum: string,
    frequencyCap: number,
    title: string,
    status: ReplyExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.endsAt = endsAt;
    this.summary = summary;
    this.cost = cost;
    this.category = category;
    this.locale = locale;
    this.checksum = checksum;
    this.frequencyCap = frequencyCap;
    this.title = title;
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

  canMoveTo(next: ReplyExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ReplyExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"reply exception"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.cost * this.endsAt * 100) / 100;
  }

  copy(): ReplyException {
    return new ReplyException(
      this.code,
      this.label,
      this.ownerId,
      this.endsAt,
      this.summary,
      this.cost,
      this.category,
      this.locale,
      this.checksum,
      this.frequencyCap,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a reply exception in status created. */
export function newReplyException(code: string, label: string): ReplyException {
  return new ReplyException(code, label, "", 0, "", 0, "", "", "", 0, "", "created");
}
