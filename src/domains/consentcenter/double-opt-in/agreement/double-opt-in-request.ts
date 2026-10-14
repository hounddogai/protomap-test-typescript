import * as text from "../../../../kit/text.js";

/** Where a double opt in request is in its life cycle. */
export type DoubleOptInRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a double opt in request and its current status. */
export class DoubleOptInRequest {
  code: string;
  title: string;
  rate: number;
  maximum: number;
  checksum: string;
  locale: string;
  updatedAt: number;
  approved: boolean;
  status: DoubleOptInRequestStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    maximum: number,
    checksum: string,
    locale: string,
    updatedAt: number,
    approved: boolean,
    status: DoubleOptInRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.maximum = maximum;
    this.checksum = checksum;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.approved = approved;
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

  canMoveTo(next: DoubleOptInRequestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.rate + this.updatedAt) * 100) / 100;
  }

  copy(): DoubleOptInRequest {
    return new DoubleOptInRequest(
      this.code,
      this.title,
      this.rate,
      this.maximum,
      this.checksum,
      this.locale,
      this.updatedAt,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a double opt in request in status new. */
export function newDoubleOptInRequest(code: string, title: string): DoubleOptInRequest {
  return new DoubleOptInRequest(code, title, 0, 0, "", "", 0, false, "new");
}
