/**
 * The retention group records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention group is in its life cycle. */
export type RetentionGroupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A retention group. Its code is unique within a tenant. */
export class RetentionGroup {
  code: string;
  name: string;
  maximum: number;
  margin: number;
  visible: boolean;
  priority: number;
  phone: string;
  archived: boolean;
  openRate: number;
  status: RetentionGroupStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    margin: number,
    visible: boolean,
    priority: number,
    phone: string,
    archived: boolean,
    openRate: number,
    status: RetentionGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.margin = margin;
    this.visible = visible;
    this.priority = priority;
    this.phone = phone;
    this.archived = archived;
    this.openRate = openRate;
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

  canMoveTo(next: RetentionGroupStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"retention group"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.priority * this.openRate * 100) / 100;
  }

  copy(): RetentionGroup {
    return new RetentionGroup(
      this.code,
      this.name,
      this.maximum,
      this.margin,
      this.visible,
      this.priority,
      this.phone,
      this.archived,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a retention group in status idle. */
export function newRetentionGroup(code: string, name: string): RetentionGroup {
  return new RetentionGroup(code, name, 0, 0, false, 0, "", false, 0, "idle");
}
