import * as text from "../../../../kit/text.js";

/** Where a primary opt out metric is in its life cycle. */
export type PrimaryOptOutMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a primary opt out metric and its current status. */
export class PrimaryOptOutMetric {
  code: string;
  name: string;
  endsAt: number;
  amount: number;
  audienceId: string;
  windowDays: number;
  reviewer: string;
  frequencyCap: number;
  retries: number;
  discount: number;
  status: PrimaryOptOutMetricStatus;

  constructor(
    code: string,
    name: string,
    endsAt: number,
    amount: number,
    audienceId: string,
    windowDays: number,
    reviewer: string,
    frequencyCap: number,
    retries: number,
    discount: number,
    status: PrimaryOptOutMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.endsAt = endsAt;
    this.amount = amount;
    this.audienceId = audienceId;
    this.windowDays = windowDays;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
    this.retries = retries;
    this.discount = discount;
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

  canMoveTo(next: PrimaryOptOutMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryOptOutMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary opt out metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round(this.frequencyCap * this.retries * 100) / 100;
  }

  copy(): PrimaryOptOutMetric {
    return new PrimaryOptOutMetric(
      this.code,
      this.name,
      this.endsAt,
      this.amount,
      this.audienceId,
      this.windowDays,
      this.reviewer,
      this.frequencyCap,
      this.retries,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary opt out metric in status idle. */
export function newPrimaryOptOutMetric(code: string, name: string): PrimaryOptOutMetric {
  return new PrimaryOptOutMetric(code, name, 0, 0, "", 0, "", 0, 0, 0, "idle");
}
