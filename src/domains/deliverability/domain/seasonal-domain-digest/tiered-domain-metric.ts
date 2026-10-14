import * as text from "../../../../kit/text.js";

/** Where a tiered domain metric is in its life cycle. */
export type TieredDomainMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A tiered domain metric. Its code is unique within a tenant. */
export class TieredDomainMetric {
  code: string;
  label: string;
  cost: number;
  frequencyCap: number;
  expiresAt: number;
  budget: number;
  status: TieredDomainMetricStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    frequencyCap: number,
    expiresAt: number,
    budget: number,
    status: TieredDomainMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.frequencyCap = frequencyCap;
    this.expiresAt = expiresAt;
    this.budget = budget;
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

  canMoveTo(next: TieredDomainMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
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

  moveTo(next: TieredDomainMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered domain metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round(this.budget * this.frequencyCap * 100) / 100;
  }

  copy(): TieredDomainMetric {
    return new TieredDomainMetric(
      this.code,
      this.label,
      this.cost,
      this.frequencyCap,
      this.expiresAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered domain metric in status idle. */
export function newTieredDomainMetric(code: string, label: string): TieredDomainMetric {
  return new TieredDomainMetric(code, label, 0, 0, 0, 0, "idle");
}
