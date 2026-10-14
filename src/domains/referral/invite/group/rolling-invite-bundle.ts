import * as text from "../../../../kit/text.js";

/** Where a rolling invite bundle is in its life cycle. */
export type RollingInviteBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A rolling invite bundle as the invite team keeps it. */
export class RollingInviteBundle {
  code: string;
  name: string;
  unit: string;
  budget: number;
  reviewer: string;
  currency: string;
  visible: boolean;
  status: RollingInviteBundleStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    budget: number,
    reviewer: string,
    currency: string,
    visible: boolean,
    status: RollingInviteBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.budget = budget;
    this.reviewer = reviewer;
    this.currency = currency;
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

  canMoveTo(next: RollingInviteBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RollingInviteBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling invite bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): RollingInviteBundle {
    return new RollingInviteBundle(
      this.code,
      this.name,
      this.unit,
      this.budget,
      this.reviewer,
      this.currency,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a rolling invite bundle in status idle. */
export function newRollingInviteBundle(code: string, name: string): RollingInviteBundle {
  return new RollingInviteBundle(code, name, "", 0, "", "", false, "idle");
}
