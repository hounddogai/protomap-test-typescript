import * as text from "../../../../kit/text.js";

/** Where a regional invite digest is in its life cycle. */
export type RegionalInviteDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** One regional invite digest, with what the planners need to act on it. */
export class RegionalInviteDigest {
  code: string;
  label: string;
  frequencyCap: number;
  channel: string;
  maximum: number;
  cost: number;
  priority: number;
  batchSize: number;
  status: RegionalInviteDigestStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    channel: string,
    maximum: number,
    cost: number,
    priority: number,
    batchSize: number,
    status: RegionalInviteDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.channel = channel;
    this.maximum = maximum;
    this.cost = cost;
    this.priority = priority;
    this.batchSize = batchSize;
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

  canMoveTo(next: RegionalInviteDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "expired":
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

  moveTo(next: RegionalInviteDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional invite digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"regional invite digest"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.batchSize * this.cost * 100) / 100;
  }

  copy(): RegionalInviteDigest {
    return new RegionalInviteDigest(
      this.code,
      this.label,
      this.frequencyCap,
      this.channel,
      this.maximum,
      this.cost,
      this.priority,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional invite digest in status requested. */
export function newRegionalInviteDigest(code: string, label: string): RegionalInviteDigest {
  return new RegionalInviteDigest(code, label, 0, "", 0, 0, 0, 0, "requested");
}
