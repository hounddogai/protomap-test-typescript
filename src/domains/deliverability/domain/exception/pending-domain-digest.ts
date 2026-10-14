import * as text from "../../../../kit/text.js";

/** Where a pending domain digest is in its life cycle. */
export type PendingDomainDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending domain digest. Its code is unique within a tenant. */
export class PendingDomainDigest {
  code: string;
  label: string;
  durationMinutes: number;
  amount: number;
  ownerId: string;
  status: PendingDomainDigestStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    amount: number,
    ownerId: string,
    status: PendingDomainDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.amount = amount;
    this.ownerId = ownerId;
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

  canMoveTo(next: PendingDomainDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: PendingDomainDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending domain digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round(this.durationMinutes * this.amount * 100) / 100;
  }

  copy(): PendingDomainDigest {
    return new PendingDomainDigest(this.code, this.label, this.durationMinutes, this.amount, this.ownerId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending domain digest in status idle. */
export function newPendingDomainDigest(code: string, label: string): PendingDomainDigest {
  return new PendingDomainDigest(code, label, 0, 0, "", "idle");
}
