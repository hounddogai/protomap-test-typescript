import * as text from "../../../../kit/text.js";

/** Where a pending reward metric is in its life cycle. */
export type PendingRewardMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a pending reward metric and its current status. */
export class PendingRewardMetric {
  code: string;
  name: string;
  label: string;
  externalRef: string;
  title: string;
  ratio: number;
  timezone: string;
  region: string;
  checksum: string;
  status: PendingRewardMetricStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    externalRef: string,
    title: string,
    ratio: number,
    timezone: string,
    region: string,
    checksum: string,
    status: PendingRewardMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.externalRef = externalRef;
    this.title = title;
    this.ratio = ratio;
    this.timezone = timezone;
    this.region = region;
    this.checksum = checksum;
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

  canMoveTo(next: PendingRewardMetricStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingRewardMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): PendingRewardMetric {
    return new PendingRewardMetric(
      this.code,
      this.name,
      this.label,
      this.externalRef,
      this.title,
      this.ratio,
      this.timezone,
      this.region,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pending reward metric in status new. */
export function newPendingRewardMetric(code: string, name: string): PendingRewardMetric {
  return new PendingRewardMetric(code, name, "", "", "", 0, "", "", "", "new");
}
