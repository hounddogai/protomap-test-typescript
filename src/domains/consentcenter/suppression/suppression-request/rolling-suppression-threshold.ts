import * as text from "../../../../kit/text.js";

/** Where a rolling suppression threshold is in its life cycle. */
export type RollingSuppressionThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a rolling suppression threshold and its current status. */
export class RollingSuppressionThreshold {
  code: string;
  label: string;
  active: boolean;
  graceDays: number;
  region: string;
  audienceId: string;
  visible: boolean;
  timezone: string;
  cost: number;
  externalRef: string;
  status: RollingSuppressionThresholdStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    graceDays: number,
    region: string,
    audienceId: string,
    visible: boolean,
    timezone: string,
    cost: number,
    externalRef: string,
    status: RollingSuppressionThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.graceDays = graceDays;
    this.region = region;
    this.audienceId = audienceId;
    this.visible = visible;
    this.timezone = timezone;
    this.cost = cost;
    this.externalRef = externalRef;
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

  canMoveTo(next: RollingSuppressionThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RollingSuppressionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling suppression threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netLoad(): number {
    return Math.round(this.cost * this.graceDays * 100) / 100;
  }

  copy(): RollingSuppressionThreshold {
    return new RollingSuppressionThreshold(
      this.code,
      this.label,
      this.active,
      this.graceDays,
      this.region,
      this.audienceId,
      this.visible,
      this.timezone,
      this.cost,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling suppression threshold in status requested. */
export function newRollingSuppressionThreshold(code: string, label: string): RollingSuppressionThreshold {
  return new RollingSuppressionThreshold(code, label, false, 0, "", "", false, "", 0, "", "requested");
}
