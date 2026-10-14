import * as text from "../../../../kit/text.js";

/** Where a suppression mapping is in its life cycle. */
export type SuppressionMappingStatus = "new" | "queued" | "running" | "done" | "failed";

/** A suppression mapping. Its code is unique within a tenant. */
export class SuppressionMapping {
  code: string;
  label: string;
  cost: number;
  retries: number;
  openRate: number;
  channel: string;
  budget: number;
  conversionRate: number;
  rate: number;
  startsAt: number;
  status: SuppressionMappingStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    retries: number,
    openRate: number,
    channel: string,
    budget: number,
    conversionRate: number,
    rate: number,
    startsAt: number,
    status: SuppressionMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.retries = retries;
    this.openRate = openRate;
    this.channel = channel;
    this.budget = budget;
    this.conversionRate = conversionRate;
    this.rate = rate;
    this.startsAt = startsAt;
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

  canMoveTo(next: SuppressionMappingStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SuppressionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedExposure(): number {
    return Math.round(this.openRate * this.conversionRate * 100) / 100;
  }

  copy(): SuppressionMapping {
    return new SuppressionMapping(
      this.code,
      this.label,
      this.cost,
      this.retries,
      this.openRate,
      this.channel,
      this.budget,
      this.conversionRate,
      this.rate,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a suppression mapping in status new. */
export function newSuppressionMapping(code: string, label: string): SuppressionMapping {
  return new SuppressionMapping(code, label, 0, 0, 0, "", 0, 0, 0, 0, "new");
}
