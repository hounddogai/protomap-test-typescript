import * as text from "../../../../kit/text.js";

/** Where a manual reply exception is in its life cycle. */
export type ManualReplyExceptionStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a manual reply exception and its current status. */
export class ManualReplyException {
  code: string;
  label: string;
  campaignRef: string;
  frequencyCap: number;
  budget: number;
  sendAt: number;
  clicks: number;
  attributes: Map<string, string>;
  quantity: number;
  channel: string;
  region: string;
  status: ManualReplyExceptionStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    frequencyCap: number,
    budget: number,
    sendAt: number,
    clicks: number,
    attributes: Map<string, string>,
    quantity: number,
    channel: string,
    region: string,
    status: ManualReplyExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.sendAt = sendAt;
    this.clicks = clicks;
    this.attributes = attributes;
    this.quantity = quantity;
    this.channel = channel;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualReplyExceptionStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ManualReplyExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reply exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"manual reply exception"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round((this.budget - this.frequencyCap) * 100) / 100;
  }

  copy(): ManualReplyException {
    return new ManualReplyException(
      this.code,
      this.label,
      this.campaignRef,
      this.frequencyCap,
      this.budget,
      this.sendAt,
      this.clicks,
      this.attributes,
      this.quantity,
      this.channel,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual reply exception in status open. */
export function newManualReplyException(code: string, label: string): ManualReplyException {
  return new ManualReplyException(code, label, "", 0, 0, 0, 0, new Map<string, string>(), 0, "", "", "open");
}
