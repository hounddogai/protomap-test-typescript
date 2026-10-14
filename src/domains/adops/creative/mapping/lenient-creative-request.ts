import * as text from "../../../../kit/text.js";

/** Where a lenient creative request is in its life cycle. */
export type LenientCreativeRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient creative request as the creative team keeps it. */
export class LenientCreativeRequest {
  code: string;
  label: string;
  score: number;
  pinned: boolean;
  reviewer: string;
  title: string;
  ceiling: number;
  attempts: number;
  ownerId: string;
  status: LenientCreativeRequestStatus;

  constructor(
    code: string,
    label: string,
    score: number,
    pinned: boolean,
    reviewer: string,
    title: string,
    ceiling: number,
    attempts: number,
    ownerId: string,
    status: LenientCreativeRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.score = score;
    this.pinned = pinned;
    this.reviewer = reviewer;
    this.title = title;
    this.ceiling = ceiling;
    this.attempts = attempts;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientCreativeRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LenientCreativeRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient creative request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"lenient creative request"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.attempts - this.score) * 100) / 100;
  }

  copy(): LenientCreativeRequest {
    return new LenientCreativeRequest(
      this.code,
      this.label,
      this.score,
      this.pinned,
      this.reviewer,
      this.title,
      this.ceiling,
      this.attempts,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a lenient creative request in status requested. */
export function newLenientCreativeRequest(code: string, label: string): LenientCreativeRequest {
  return new LenientCreativeRequest(code, label, 0, false, "", "", 0, 0, "", "requested");
}
