import * as text from "../../../../kit/text.js";

/** Where a sender audit is in its life cycle. */
export type SenderAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** A sender audit. Its code is unique within a tenant. */
export class SenderAudit {
  code: string;
  name: string;
  segment: string;
  attributes: Map<string, string>;
  reviewer: string;
  externalRef: string;
  campaignRef: string;
  budget: number;
  bid: number;
  status: SenderAuditStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    attributes: Map<string, string>,
    reviewer: string,
    externalRef: string,
    campaignRef: string,
    budget: number,
    bid: number,
    status: SenderAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.attributes = attributes;
    this.reviewer = reviewer;
    this.externalRef = externalRef;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.bid = bid;
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

  canMoveTo(next: SenderAuditStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SenderAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"sender audit"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round((this.budget + this.bid) * 100) / 100;
  }

  copy(): SenderAudit {
    return new SenderAudit(
      this.code,
      this.name,
      this.segment,
      this.attributes,
      this.reviewer,
      this.externalRef,
      this.campaignRef,
      this.budget,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a sender audit in status new. */
export function newSenderAudit(code: string, name: string): SenderAudit {
  return new SenderAudit(code, name, "", new Map<string, string>(), "", "", "", 0, 0, "new");
}
