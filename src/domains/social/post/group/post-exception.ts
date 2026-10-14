import * as text from "../../../../kit/text.js";

/** Where a post exception is in its life cycle. */
export type PostExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** A post exception as the post team keeps it. */
export class PostException {
  code: string;
  label: string;
  createdAt: number;
  conversionRate: number;
  externalRef: string;
  pinned: boolean;
  rate: number;
  status: PostExceptionStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    conversionRate: number,
    externalRef: string,
    pinned: boolean,
    rate: number,
    status: PostExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.conversionRate = conversionRate;
    this.externalRef = externalRef;
    this.pinned = pinned;
    this.rate = rate;
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

  canMoveTo(next: PostExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.createdAt - this.rate) * 100) / 100;
  }

  copy(): PostException {
    return new PostException(
      this.code,
      this.label,
      this.createdAt,
      this.conversionRate,
      this.externalRef,
      this.pinned,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a post exception in status requested. */
export function newPostException(code: string, label: string): PostException {
  return new PostException(code, label, 0, 0, "", false, 0, "requested");
}
