import * as text from "../../../../kit/text.js";

/** Where a double opt in group is in its life cycle. */
export type DoubleOptInGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a double opt in group and its current status. */
export class DoubleOptInGroup {
  code: string;
  label: string;
  archived: boolean;
  weight: number;
  expiresAt: number;
  margin: number;
  active: boolean;
  category: string;
  windowDays: number;
  status: DoubleOptInGroupStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    weight: number,
    expiresAt: number,
    margin: number,
    active: boolean,
    category: string,
    windowDays: number,
    status: DoubleOptInGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.margin = margin;
    this.active = active;
    this.category = category;
    this.windowDays = windowDays;
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

  canMoveTo(next: DoubleOptInGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DoubleOptInGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"double opt in group"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.windowDays + this.expiresAt) * 100) / 100;
  }

  copy(): DoubleOptInGroup {
    return new DoubleOptInGroup(
      this.code,
      this.label,
      this.archived,
      this.weight,
      this.expiresAt,
      this.margin,
      this.active,
      this.category,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a double opt in group in status requested. */
export function newDoubleOptInGroup(code: string, label: string): DoubleOptInGroup {
  return new DoubleOptInGroup(code, label, false, 0, 0, 0, false, "", 0, "requested");
}
