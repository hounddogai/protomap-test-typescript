import * as text from "../../../../kit/text.js";

/** Where a fallback payout notice is in its life cycle. */
export type FallbackPayoutNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback payout notice. Its code is unique within a tenant. */
export class FallbackPayoutNotice {
  code: string;
  name: string;
  batchSize: number;
  contactEmail: string;
  utmSource: string;
  category: string;
  status: FallbackPayoutNoticeStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    contactEmail: string,
    utmSource: string,
    category: string,
    status: FallbackPayoutNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.contactEmail = contactEmail;
    this.utmSource = utmSource;
    this.category = category;
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

  canMoveTo(next: FallbackPayoutNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
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
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackPayoutNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback payout notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.batchSize;
  }

  copy(): FallbackPayoutNotice {
    return new FallbackPayoutNotice(
      this.code,
      this.name,
      this.batchSize,
      this.contactEmail,
      this.utmSource,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a fallback payout notice in status new. */
export function newFallbackPayoutNotice(code: string, name: string): FallbackPayoutNotice {
  return new FallbackPayoutNotice(code, name, 0, "", "", "", "new");
}
