import * as text from "../../../../kit/text.js";

/** Where a badge threshold is in its life cycle. */
export type BadgeThresholdStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A badge threshold. Its code is unique within a tenant. */
export class BadgeThreshold {
  code: string;
  label: string;
  name: string;
  createdAt: number;
  visible: boolean;
  openRate: number;
  windowDays: number;
  attempts: number;
  status: BadgeThresholdStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    createdAt: number,
    visible: boolean,
    openRate: number,
    windowDays: number,
    attempts: number,
    status: BadgeThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.createdAt = createdAt;
    this.visible = visible;
    this.openRate = openRate;
    this.windowDays = windowDays;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgeThresholdStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: BadgeThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"badge threshold"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round((this.windowDays - this.openRate) * 100) / 100;
  }

  copy(): BadgeThreshold {
    return new BadgeThreshold(
      this.code,
      this.label,
      this.name,
      this.createdAt,
      this.visible,
      this.openRate,
      this.windowDays,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a badge threshold in status draft. */
export function newBadgeThreshold(code: string, label: string): BadgeThreshold {
  return new BadgeThreshold(code, label, "", 0, false, 0, 0, 0, "draft");
}
