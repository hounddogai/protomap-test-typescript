/**
 * The regional touchpoint audit records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional touchpoint audit is in its life cycle. */
export type RegionalTouchpointAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A regional touchpoint audit. Its code is unique within a tenant. */
export class RegionalTouchpointAudit {
  code: string;
  title: string;
  campaignRef: string;
  tags: string[];
  revision: number;
  channel: string;
  externalRef: string;
  limit: number;
  sendAt: number;
  status: RegionalTouchpointAuditStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    tags: string[],
    revision: number,
    channel: string,
    externalRef: string,
    limit: number,
    sendAt: number,
    status: RegionalTouchpointAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.tags = tags;
    this.revision = revision;
    this.channel = channel;
    this.externalRef = externalRef;
    this.limit = limit;
    this.sendAt = sendAt;
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

  canMoveTo(next: RegionalTouchpointAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalTouchpointAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional touchpoint audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedVolume(): number {
    return Math.round((this.sendAt - this.limit) * 100) / 100;
  }

  copy(): RegionalTouchpointAudit {
    return new RegionalTouchpointAudit(
      this.code,
      this.title,
      this.campaignRef,
      this.tags,
      this.revision,
      this.channel,
      this.externalRef,
      this.limit,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional touchpoint audit in status draft. */
export function newRegionalTouchpointAudit(code: string, title: string): RegionalTouchpointAudit {
  return new RegionalTouchpointAudit(code, title, "", [], 0, "", "", 0, 0, "draft");
}
