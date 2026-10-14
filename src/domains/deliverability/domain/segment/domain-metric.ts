import * as text from "../../../../kit/text.js";

/** Where a domain metric is in its life cycle. */
export type DomainMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a domain metric and its current status. */
export class DomainMetric {
  code: string;
  label: string;
  windowDays: number;
  description: string;
  frequencyCap: number;
  durationMinutes: number;
  campaignRef: string;
  quantity: number;
  visible: boolean;
  status: DomainMetricStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    description: string,
    frequencyCap: number,
    durationMinutes: number,
    campaignRef: string,
    quantity: number,
    visible: boolean,
    status: DomainMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.description = description;
    this.frequencyCap = frequencyCap;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.visible = visible;
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

  canMoveTo(next: DomainMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
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

  moveTo(next: DomainMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.windowDays + this.quantity) * 100) / 100;
  }

  copy(): DomainMetric {
    return new DomainMetric(
      this.code,
      this.label,
      this.windowDays,
      this.description,
      this.frequencyCap,
      this.durationMinutes,
      this.campaignRef,
      this.quantity,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a domain metric in status idle. */
export function newDomainMetric(code: string, label: string): DomainMetric {
  return new DomainMetric(code, label, 0, "", 0, 0, "", 0, false, "idle");
}
