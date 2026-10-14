import * as text from "../../../../kit/text.js";

/** Where a tiered sender target is in its life cycle. */
export type TieredSenderTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered sender target. Its code is unique within a tenant. */
export class TieredSenderTarget {
  code: string;
  name: string;
  ownerId: string;
  source: string;
  sendAt: number;
  status: TieredSenderTargetStatus;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    source: string,
    sendAt: number,
    status: TieredSenderTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.source = source;
    this.sendAt = sendAt;
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

  canMoveTo(next: TieredSenderTargetStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredSenderTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered sender target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.sendAt;
  }

  copy(): TieredSenderTarget {
    return new TieredSenderTarget(this.code, this.name, this.ownerId, this.source, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered sender target in status idle. */
export function newTieredSenderTarget(code: string, name: string): TieredSenderTarget {
  return new TieredSenderTarget(code, name, "", "", 0, "idle");
}
