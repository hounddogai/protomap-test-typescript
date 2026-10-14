import * as text from "../../../../kit/text.js";

/** Where a touchpoint reservation is in its life cycle. */
export type TouchpointReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** A touchpoint reservation. Its code is unique within a tenant. */
export class TouchpointReservation {
  code: string;
  name: string;
  windowDays: number;
  threshold: number;
  impressions: number;
  cost: number;
  budget: number;
  priority: number;
  openRate: number;
  createdAt: number;
  status: TouchpointReservationStatus;

  constructor(
    code: string,
    name: string,
    windowDays: number,
    threshold: number,
    impressions: number,
    cost: number,
    budget: number,
    priority: number,
    openRate: number,
    createdAt: number,
    status: TouchpointReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.windowDays = windowDays;
    this.threshold = threshold;
    this.impressions = impressions;
    this.cost = cost;
    this.budget = budget;
    this.priority = priority;
    this.openRate = openRate;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TouchpointReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedExposure(): number {
    return Math.round((this.impressions - this.createdAt) * 100) / 100;
  }

  copy(): TouchpointReservation {
    return new TouchpointReservation(
      this.code,
      this.name,
      this.windowDays,
      this.threshold,
      this.impressions,
      this.cost,
      this.budget,
      this.priority,
      this.openRate,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a touchpoint reservation in status requested. */
export function newTouchpointReservation(code: string, name: string): TouchpointReservation {
  return new TouchpointReservation(code, name, 0, 0, 0, 0, 0, 0, 0, 0, "requested");
}
