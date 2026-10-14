/**
 * The rolling level policy records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling level policy is in its life cycle. */
export type RollingLevelPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A rolling level policy as the level team keeps it. */
export class RollingLevelPolicy {
  code: string;
  name: string;
  active: boolean;
  floorValue: number;
  visible: boolean;
  impressions: number;
  description: string;
  durationMinutes: number;
  status: RollingLevelPolicyStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    floorValue: number,
    visible: boolean,
    impressions: number,
    description: string,
    durationMinutes: number,
    status: RollingLevelPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.floorValue = floorValue;
    this.visible = visible;
    this.impressions = impressions;
    this.description = description;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RollingLevelPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingLevelPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling level policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netValue(): number {
    return Math.round((this.durationMinutes - this.floorValue) * 100) / 100;
  }

  copy(): RollingLevelPolicy {
    return new RollingLevelPolicy(
      this.code,
      this.name,
      this.active,
      this.floorValue,
      this.visible,
      this.impressions,
      this.description,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling level policy in status planned. */
export function newRollingLevelPolicy(code: string, name: string): RollingLevelPolicy {
  return new RollingLevelPolicy(code, name, false, 0, false, 0, "", 0, "planned");
}
