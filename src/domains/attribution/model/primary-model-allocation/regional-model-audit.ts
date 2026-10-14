import * as text from "../../../../kit/text.js";

/** Where a regional model audit is in its life cycle. */
export type RegionalModelAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** One regional model audit, with what the planners need to act on it. */
export class RegionalModelAudit {
  code: string;
  title: string;
  name: string;
  attempts: number;
  rate: number;
  summary: string;
  updatedAt: number;
  batchSize: number;
  campaignRef: string;
  ownerId: string;
  status: RegionalModelAuditStatus;

  constructor(
    code: string,
    title: string,
    name: string,
    attempts: number,
    rate: number,
    summary: string,
    updatedAt: number,
    batchSize: number,
    campaignRef: string,
    ownerId: string,
    status: RegionalModelAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.attempts = attempts;
    this.rate = rate;
    this.summary = summary;
    this.updatedAt = updatedAt;
    this.batchSize = batchSize;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
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

  canMoveTo(next: RegionalModelAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: RegionalModelAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional model audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.attempts * this.updatedAt * 100) / 100;
  }

  copy(): RegionalModelAudit {
    return new RegionalModelAudit(
      this.code,
      this.title,
      this.name,
      this.attempts,
      this.rate,
      this.summary,
      this.updatedAt,
      this.batchSize,
      this.campaignRef,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional model audit in status requested. */
export function newRegionalModelAudit(code: string, title: string): RegionalModelAudit {
  return new RegionalModelAudit(code, title, "", 0, 0, "", 0, 0, "", "", "requested");
}
