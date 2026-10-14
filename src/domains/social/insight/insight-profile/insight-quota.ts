import * as text from "../../../../kit/text.js";

/** Where a insight quota is in its life cycle. */
export type InsightQuotaStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A insight quota. Its code is unique within a tenant. */
export class InsightQuota {
  code: string;
  title: string;
  startsAt: number;
  ownerId: string;
  capacity: number;
  expiresAt: number;
  version: number;
  approved: boolean;
  status: InsightQuotaStatus;

  constructor(
    code: string,
    title: string,
    startsAt: number,
    ownerId: string,
    capacity: number,
    expiresAt: number,
    version: number,
    approved: boolean,
    status: InsightQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.startsAt = startsAt;
    this.ownerId = ownerId;
    this.capacity = capacity;
    this.expiresAt = expiresAt;
    this.version = version;
    this.approved = approved;
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

  canMoveTo(next: InsightQuotaStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: InsightQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round((this.version - this.startsAt) * 100) / 100;
  }

  copy(): InsightQuota {
    return new InsightQuota(
      this.code,
      this.title,
      this.startsAt,
      this.ownerId,
      this.capacity,
      this.expiresAt,
      this.version,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a insight quota in status draft. */
export function newInsightQuota(code: string, title: string): InsightQuota {
  return new InsightQuota(code, title, 0, "", 0, 0, 0, false, "draft");
}
