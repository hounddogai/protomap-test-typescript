import * as text from "../../../../kit/text.js";

/** Where a manual badge forecast is in its life cycle. */
export type ManualBadgeForecastStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual badge forecast. Its code is unique within a tenant. */
export class ManualBadgeForecast {
  code: string;
  title: string;
  attempts: number;
  margin: number;
  sendAt: number;
  campaignRef: string;
  maximum: number;
  channel: string;
  capacity: number;
  status: ManualBadgeForecastStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    margin: number,
    sendAt: number,
    campaignRef: string,
    maximum: number,
    channel: string,
    capacity: number,
    status: ManualBadgeForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.margin = margin;
    this.sendAt = sendAt;
    this.campaignRef = campaignRef;
    this.maximum = maximum;
    this.channel = channel;
    this.capacity = capacity;
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

  canMoveTo(next: ManualBadgeForecastStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualBadgeForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual badge forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual badge forecast"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.sendAt - this.margin) * 100) / 100;
  }

  copy(): ManualBadgeForecast {
    return new ManualBadgeForecast(
      this.code,
      this.title,
      this.attempts,
      this.margin,
      this.sendAt,
      this.campaignRef,
      this.maximum,
      this.channel,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual badge forecast in status new. */
export function newManualBadgeForecast(code: string, title: string): ManualBadgeForecast {
  return new ManualBadgeForecast(code, title, 0, 0, 0, "", 0, "", 0, "new");
}
