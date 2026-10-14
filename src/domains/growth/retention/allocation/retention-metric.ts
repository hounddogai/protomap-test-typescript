import * as text from "../../../../kit/text.js";

/** Where a retention metric is in its life cycle. */
export type RetentionMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One retention metric, with what the planners need to act on it. */
export class RetentionMetric {
  code: string;
  name: string;
  revision: number;
  phone: string;
  weight: number;
  createdAt: number;
  cohort: string;
  openRate: number;
  maximum: number;
  externalRef: string;
  pinned: boolean;
  status: RetentionMetricStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    phone: string,
    weight: number,
    createdAt: number,
    cohort: string,
    openRate: number,
    maximum: number,
    externalRef: string,
    pinned: boolean,
    status: RetentionMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.phone = phone;
    this.weight = weight;
    this.createdAt = createdAt;
    this.cohort = cohort;
    this.openRate = openRate;
    this.maximum = maximum;
    this.externalRef = externalRef;
    this.pinned = pinned;
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

  canMoveTo(next: RetentionMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RetentionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.weight - this.maximum) * 100) / 100;
  }

  copy(): RetentionMetric {
    return new RetentionMetric(
      this.code,
      this.name,
      this.revision,
      this.phone,
      this.weight,
      this.createdAt,
      this.cohort,
      this.openRate,
      this.maximum,
      this.externalRef,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention metric in status idle. */
export function newRetentionMetric(code: string, name: string): RetentionMetric {
  return new RetentionMetric(code, name, 0, "", 0, 0, "", 0, 0, "", false, "idle");
}
