import * as text from "../../../../kit/text.js";

/** Where a opt out digest is in its life cycle. */
export type OptOutDigestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a opt out digest and its current status. */
export class OptOutDigest {
  code: string;
  label: string;
  minimum: number;
  ownerId: string;
  archived: boolean;
  margin: number;
  conversionRate: number;
  phone: string;
  channel: string;
  openRate: number;
  title: string;
  status: OptOutDigestStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    ownerId: string,
    archived: boolean,
    margin: number,
    conversionRate: number,
    phone: string,
    channel: string,
    openRate: number,
    title: string,
    status: OptOutDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.ownerId = ownerId;
    this.archived = archived;
    this.margin = margin;
    this.conversionRate = conversionRate;
    this.phone = phone;
    this.channel = channel;
    this.openRate = openRate;
    this.title = title;
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

  canMoveTo(next: OptOutDigestStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: OptOutDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netVolume(): number {
    return Math.round((this.margin + this.conversionRate) * 100) / 100;
  }

  copy(): OptOutDigest {
    return new OptOutDigest(
      this.code,
      this.label,
      this.minimum,
      this.ownerId,
      this.archived,
      this.margin,
      this.conversionRate,
      this.phone,
      this.channel,
      this.openRate,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a opt out digest in status idle. */
export function newOptOutDigest(code: string, label: string): OptOutDigest {
  return new OptOutDigest(code, label, 0, "", false, 0, 0, "", "", 0, "", "idle");
}
