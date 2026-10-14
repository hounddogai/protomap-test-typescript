import * as text from "../../../../kit/text.js";

/** Where a funnel reservation is in its life cycle. */
export type FunnelReservationStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A funnel reservation as the funnel team keeps it. */
export class FunnelReservation {
  code: string;
  name: string;
  campaignRef: string;
  channel: string;
  locale: string;
  reviewer: string;
  amount: number;
  batchSize: number;
  tags: string[];
  label: string;
  status: FunnelReservationStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    channel: string,
    locale: string,
    reviewer: string,
    amount: number,
    batchSize: number,
    tags: string[],
    label: string,
    status: FunnelReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.locale = locale;
    this.reviewer = reviewer;
    this.amount = amount;
    this.batchSize = batchSize;
    this.tags = tags;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FunnelReservationStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FunnelReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.amount + this.batchSize) * 100) / 100;
  }

  copy(): FunnelReservation {
    return new FunnelReservation(
      this.code,
      this.name,
      this.campaignRef,
      this.channel,
      this.locale,
      this.reviewer,
      this.amount,
      this.batchSize,
      this.tags,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a funnel reservation in status idle. */
export function newFunnelReservation(code: string, name: string): FunnelReservation {
  return new FunnelReservation(code, name, "", "", "", "", 0, 0, [], "", "idle");
}
