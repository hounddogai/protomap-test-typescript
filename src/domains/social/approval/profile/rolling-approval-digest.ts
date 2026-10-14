import * as text from "../../../../kit/text.js";

/** Where a rolling approval digest is in its life cycle. */
export type RollingApprovalDigestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a rolling approval digest and its current status. */
export class RollingApprovalDigest {
  code: string;
  label: string;
  quantity: number;
  channel: string;
  archived: boolean;
  limit: number;
  ratio: number;
  segment: string;
  cost: number;
  retries: number;
  status: RollingApprovalDigestStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    channel: string,
    archived: boolean,
    limit: number,
    ratio: number,
    segment: string,
    cost: number,
    retries: number,
    status: RollingApprovalDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.channel = channel;
    this.archived = archived;
    this.limit = limit;
    this.ratio = ratio;
    this.segment = segment;
    this.cost = cost;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingApprovalDigestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingApprovalDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling approval digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round((this.quantity + this.cost) * 100) / 100;
  }

  copy(): RollingApprovalDigest {
    return new RollingApprovalDigest(
      this.code,
      this.label,
      this.quantity,
      this.channel,
      this.archived,
      this.limit,
      this.ratio,
      this.segment,
      this.cost,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling approval digest in status draft. */
export function newRollingApprovalDigest(code: string, label: string): RollingApprovalDigest {
  return new RollingApprovalDigest(code, label, 0, "", false, 0, 0, "", 0, 0, "draft");
}
