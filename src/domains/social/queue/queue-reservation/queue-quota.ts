import * as text from "../../../../kit/text.js";

/** Where a queue quota is in its life cycle. */
export type QueueQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A queue quota. Its code is unique within a tenant. */
export class QueueQuota {
  code: string;
  title: string;
  openRate: number;
  cost: number;
  floorValue: number;
  status: QueueQuotaStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    cost: number,
    floorValue: number,
    status: QueueQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.cost = cost;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: QueueQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: QueueQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.openRate - this.floorValue) * 100) / 100;
  }

  copy(): QueueQuota {
    return new QueueQuota(this.code, this.title, this.openRate, this.cost, this.floorValue, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a queue quota in status proposed. */
export function newQueueQuota(code: string, title: string): QueueQuota {
  return new QueueQuota(code, title, 0, 0, 0, "proposed");
}
