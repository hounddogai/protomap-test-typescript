import * as text from "../../../../kit/text.js";

/** Where a bounce score is in its life cycle. */
export type BounceScoreStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a bounce score and its current status. */
export class BounceScore {
  code: string;
  name: string;
  sequence: number;
  locale: string;
  amount: number;
  visible: boolean;
  title: string;
  rate: number;
  pinned: boolean;
  status: BounceScoreStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    locale: string,
    amount: number,
    visible: boolean,
    title: string,
    rate: number,
    pinned: boolean,
    status: BounceScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.locale = locale;
    this.amount = amount;
    this.visible = visible;
    this.title = title;
    this.rate = rate;
    this.pinned = pinned;
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

  canMoveTo(next: BounceScoreStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
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

  moveTo(next: BounceScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveValue(): number {
    return Math.round((this.amount + this.sequence) * 100) / 100;
  }

  copy(): BounceScore {
    return new BounceScore(
      this.code,
      this.name,
      this.sequence,
      this.locale,
      this.amount,
      this.visible,
      this.title,
      this.rate,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a bounce score in status idle. */
export function newBounceScore(code: string, name: string): BounceScore {
  return new BounceScore(code, name, 0, "", 0, false, "", 0, false, "idle");
}
