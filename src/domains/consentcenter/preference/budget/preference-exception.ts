import * as text from "../../../../kit/text.js";

/** Where a preference exception is in its life cycle. */
export type PreferenceExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A preference exception. Its code is unique within a tenant. */
export class PreferenceException {
  code: string;
  title: string;
  endsAt: number;
  pinned: boolean;
  amount: number;
  maximum: number;
  visible: boolean;
  expiresAt: number;
  segment: string;
  status: PreferenceExceptionStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    pinned: boolean,
    amount: number,
    maximum: number,
    visible: boolean,
    expiresAt: number,
    segment: string,
    status: PreferenceExceptionStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.pinned = pinned;
    this.amount = amount;
    this.maximum = maximum;
    this.visible = visible;
    this.expiresAt = expiresAt;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: PreferenceExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PreferenceExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"preference exception"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.endsAt * this.maximum * 100) / 100;
  }

  copy(): PreferenceException {
    return new PreferenceException(
      this.code,
      this.title,
      this.endsAt,
      this.pinned,
      this.amount,
      this.maximum,
      this.visible,
      this.expiresAt,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a preference exception in status idle. */
export function newPreferenceException(code: string, title: string): PreferenceException {
  return new PreferenceException(code, title, 0, false, 0, 0, false, 0, "", "idle");
}
