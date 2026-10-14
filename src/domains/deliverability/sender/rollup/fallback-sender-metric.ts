import * as text from "../../../../kit/text.js";

/** Where a fallback sender metric is in its life cycle. */
export type FallbackSenderMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback sender metric as the sender team keeps it. */
export class FallbackSenderMetric {
  code: string;
  label: string;
  pinned: boolean;
  timezone: string;
  visible: boolean;
  weight: number;
  maximum: number;
  sendAt: number;
  limit: number;
  clicks: number;
  status: FallbackSenderMetricStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    timezone: string,
    visible: boolean,
    weight: number,
    maximum: number,
    sendAt: number,
    limit: number,
    clicks: number,
    status: FallbackSenderMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.timezone = timezone;
    this.visible = visible;
    this.weight = weight;
    this.maximum = maximum;
    this.sendAt = sendAt;
    this.limit = limit;
    this.clicks = clicks;
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

  canMoveTo(next: FallbackSenderMetricStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackSenderMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sender metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netExposure(): number {
    return Math.round((this.weight - this.limit) * 100) / 100;
  }

  copy(): FallbackSenderMetric {
    return new FallbackSenderMetric(
      this.code,
      this.label,
      this.pinned,
      this.timezone,
      this.visible,
      this.weight,
      this.maximum,
      this.sendAt,
      this.limit,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback sender metric in status new. */
export function newFallbackSenderMetric(code: string, label: string): FallbackSenderMetric {
  return new FallbackSenderMetric(code, label, false, "", false, 0, 0, 0, 0, 0, "new");
}
