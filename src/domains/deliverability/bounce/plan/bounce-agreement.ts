import * as text from "../../../../kit/text.js";

/** Where a bounce agreement is in its life cycle. */
export type BounceAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a bounce agreement and its current status. */
export class BounceAgreement {
  code: string;
  title: string;
  active: boolean;
  channel: string;
  updatedAt: number;
  status: BounceAgreementStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    channel: string,
    updatedAt: number,
    status: BounceAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.channel = channel;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: BounceAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
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
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): BounceAgreement {
    return new BounceAgreement(this.code, this.title, this.active, this.channel, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a bounce agreement in status idle. */
export function newBounceAgreement(code: string, title: string): BounceAgreement {
  return new BounceAgreement(code, title, false, "", 0, "idle");
}
