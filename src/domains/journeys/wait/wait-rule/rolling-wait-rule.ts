/**
 * The rolling wait rule records of journeys's wait work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling wait rule is in its life cycle. */
export type RollingWaitRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling wait rule, with what the planners need to act on it. */
export class RollingWaitRule {
  code: string;
  title: string;
  minimum: number;
  ceiling: number;
  summary: string;
  approved: boolean;
  capacity: number;
  durationMinutes: number;
  expiresAt: number;
  status: RollingWaitRuleStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    ceiling: number,
    summary: string,
    approved: boolean,
    capacity: number,
    durationMinutes: number,
    expiresAt: number,
    status: RollingWaitRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.ceiling = ceiling;
    this.summary = summary;
    this.approved = approved;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: RollingWaitRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingWaitRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling wait rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round(this.durationMinutes * this.expiresAt * 100) / 100;
  }

  copy(): RollingWaitRule {
    return new RollingWaitRule(
      this.code,
      this.title,
      this.minimum,
      this.ceiling,
      this.summary,
      this.approved,
      this.capacity,
      this.durationMinutes,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling wait rule in status planned. */
export function newRollingWaitRule(code: string, title: string): RollingWaitRule {
  return new RollingWaitRule(code, title, 0, 0, "", false, 0, 0, 0, "planned");
}
