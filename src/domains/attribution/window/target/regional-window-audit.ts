import * as text from "../../../../kit/text.js";

/** Where a regional window audit is in its life cycle. */
export type RegionalWindowAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional window audit. Its code is unique within a tenant. */
export class RegionalWindowAudit {
  code: string;
  name: string;
  channel: string;
  discount: number;
  ownerId: string;
  endsAt: number;
  status: RegionalWindowAuditStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    discount: number,
    ownerId: string,
    endsAt: number,
    status: RegionalWindowAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.discount = discount;
    this.ownerId = ownerId;
    this.endsAt = endsAt;
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

  canMoveTo(next: RegionalWindowAuditStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RegionalWindowAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional window audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.endsAt - this.discount) * 100) / 100;
  }

  copy(): RegionalWindowAudit {
    return new RegionalWindowAudit(
      this.code,
      this.name,
      this.channel,
      this.discount,
      this.ownerId,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional window audit in status new. */
export function newRegionalWindowAudit(code: string, name: string): RegionalWindowAudit {
  return new RegionalWindowAudit(code, name, "", 0, "", 0, "new");
}
