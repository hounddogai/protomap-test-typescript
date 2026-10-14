import * as text from "../../../../kit/text.js";

/** Where a tier audit is in its life cycle. */
export type TierAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** A tier audit. Its code is unique within a tenant. */
export class TierAudit {
  code: string;
  title: string;
  ratio: number;
  graceDays: number;
  active: boolean;
  openRate: number;
  region: string;
  description: string;
  tags: string[];
  phone: string;
  archived: boolean;
  status: TierAuditStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    graceDays: number,
    active: boolean,
    openRate: number,
    region: string,
    description: string,
    tags: string[],
    phone: string,
    archived: boolean,
    status: TierAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.graceDays = graceDays;
    this.active = active;
    this.openRate = openRate;
    this.region = region;
    this.description = description;
    this.tags = tags;
    this.phone = phone;
    this.archived = archived;
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

  canMoveTo(next: TierAuditStatus): boolean {
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TierAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round(this.ratio * this.openRate * 100) / 100;
  }

  copy(): TierAudit {
    return new TierAudit(
      this.code,
      this.title,
      this.ratio,
      this.graceDays,
      this.active,
      this.openRate,
      this.region,
      this.description,
      this.tags,
      this.phone,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a tier audit in status requested. */
export function newTierAudit(code: string, title: string): TierAudit {
  return new TierAudit(code, title, 0, 0, false, 0, "", "", [], "", false, "requested");
}
