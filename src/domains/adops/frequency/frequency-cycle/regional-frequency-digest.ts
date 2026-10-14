import * as text from "../../../../kit/text.js";

/** Where a regional frequency digest is in its life cycle. */
export type RegionalFrequencyDigestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional frequency digest. Its code is unique within a tenant. */
export class RegionalFrequencyDigest {
  code: string;
  name: string;
  windowDays: number;
  budget: number;
  openRate: number;
  campaignRef: string;
  visible: boolean;
  segment: string;
  summary: string;
  bid: number;
  channel: string;
  status: RegionalFrequencyDigestStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    budget: number,
    openRate: number,
    campaignRef: string,
    visible: boolean,
    segment: string,
    summary: string,
    bid: number,
    channel: string,
    status: RegionalFrequencyDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.budget = budget;
    this.openRate = openRate;
    this.campaignRef = campaignRef;
    this.visible = visible;
    this.segment = segment;
    this.summary = summary;
    this.bid = bid;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalFrequencyDigestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalFrequencyDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional frequency digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional frequency digest"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.budget + this.openRate) * 100) / 100;
  }

  copy(): RegionalFrequencyDigest {
    return new RegionalFrequencyDigest(
      this.code,
      this.name,
      this.windowDays,
      this.budget,
      this.openRate,
      this.campaignRef,
      this.visible,
      this.segment,
      this.summary,
      this.bid,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a regional frequency digest in status planned. */
export function newRegionalFrequencyDigest(code: string, name: string): RegionalFrequencyDigest {
  return new RegionalFrequencyDigest(code, name, 0, 0, 0, "", false, "", "", 0, "", "planned");
}
