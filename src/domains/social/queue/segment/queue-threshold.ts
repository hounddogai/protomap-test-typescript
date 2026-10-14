import * as text from "../../../../kit/text.js";

/** Where a queue threshold is in its life cycle. */
export type QueueThresholdStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A queue threshold as the queue team keeps it. */
export class QueueThreshold {
  code: string;
  name: string;
  threshold: number;
  country: string;
  durationMinutes: number;
  updatedAt: number;
  frequencyCap: number;
  locale: string;
  status: QueueThresholdStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    country: string,
    durationMinutes: number,
    updatedAt: number,
    frequencyCap: number,
    locale: string,
    status: QueueThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.country = country;
    this.durationMinutes = durationMinutes;
    this.updatedAt = updatedAt;
    this.frequencyCap = frequencyCap;
    this.locale = locale;
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

  canMoveTo(next: QueueThresholdStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: QueueThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netExposure(): number {
    return Math.round((this.durationMinutes - this.frequencyCap) * 100) / 100;
  }

  copy(): QueueThreshold {
    return new QueueThreshold(
      this.code,
      this.name,
      this.threshold,
      this.country,
      this.durationMinutes,
      this.updatedAt,
      this.frequencyCap,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a queue threshold in status idle. */
export function newQueueThreshold(code: string, name: string): QueueThreshold {
  return new QueueThreshold(code, name, 0, "", 0, 0, 0, "", "idle");
}
