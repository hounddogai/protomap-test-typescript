/**
 * The level plan records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level plan is in its life cycle. */
export type LevelPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A level plan as the level team keeps it. */
export class LevelPlan {
  code: string;
  label: string;
  externalRef: string;
  minimum: number;
  phone: string;
  createdAt: number;
  quantity: number;
  capacity: number;
  contactEmail: string;
  revision: number;
  channel: string;
  status: LevelPlanStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    minimum: number,
    phone: string,
    createdAt: number,
    quantity: number,
    capacity: number,
    contactEmail: string,
    revision: number,
    channel: string,
    status: LevelPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.minimum = minimum;
    this.phone = phone;
    this.createdAt = createdAt;
    this.quantity = quantity;
    this.capacity = capacity;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.channel = channel;
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

  canMoveTo(next: LevelPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round((this.quantity - this.revision) * 100) / 100;
  }

  copy(): LevelPlan {
    return new LevelPlan(
      this.code,
      this.label,
      this.externalRef,
      this.minimum,
      this.phone,
      this.createdAt,
      this.quantity,
      this.capacity,
      this.contactEmail,
      this.revision,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a level plan in status draft. */
export function newLevelPlan(code: string, label: string): LevelPlan {
  return new LevelPlan(code, label, "", 0, "", 0, 0, 0, "", 0, "", "draft");
}
