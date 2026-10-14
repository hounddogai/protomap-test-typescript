import * as text from "../../../../kit/text.js";

/** Where a double opt in quota is in its life cycle. */
export type DoubleOptInQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a double opt in quota and its current status. */
export class DoubleOptInQuota {
  code: string;
  name: string;
  cost: number;
  phone: string;
  archived: boolean;
  notes: string;
  journeyId: string;
  title: string;
  unit: string;
  capacity: number;
  status: DoubleOptInQuotaStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    phone: string,
    archived: boolean,
    notes: string,
    journeyId: string,
    title: string,
    unit: string,
    capacity: number,
    status: DoubleOptInQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.phone = phone;
    this.archived = archived;
    this.notes = notes;
    this.journeyId = journeyId;
    this.title = title;
    this.unit = unit;
    this.capacity = capacity;
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

  canMoveTo(next: DoubleOptInQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DoubleOptInQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round((this.cost + this.capacity) * 100) / 100;
  }

  copy(): DoubleOptInQuota {
    return new DoubleOptInQuota(
      this.code,
      this.name,
      this.cost,
      this.phone,
      this.archived,
      this.notes,
      this.journeyId,
      this.title,
      this.unit,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a double opt in quota in status idle. */
export function newDoubleOptInQuota(code: string, name: string): DoubleOptInQuota {
  return new DoubleOptInQuota(code, name, 0, "", false, "", "", "", "", 0, "idle");
}
