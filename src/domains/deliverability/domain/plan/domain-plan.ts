/**
 * The domain plan records of deliverability's domain work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a domain plan is in its life cycle. */
export type DomainPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A domain plan as the domain team keeps it. */
export class DomainPlan {
  code: string;
  title: string;
  timezone: string;
  source: string;
  name: string;
  createdAt: number;
  visible: boolean;
  priority: number;
  ceiling: number;
  status: DomainPlanStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    source: string,
    name: string,
    createdAt: number,
    visible: boolean,
    priority: number,
    ceiling: number,
    status: DomainPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.source = source;
    this.name = name;
    this.createdAt = createdAt;
    this.visible = visible;
    this.priority = priority;
    this.ceiling = ceiling;
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

  canMoveTo(next: DomainPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DomainPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round(this.priority * this.createdAt * 100) / 100;
  }

  copy(): DomainPlan {
    return new DomainPlan(
      this.code,
      this.title,
      this.timezone,
      this.source,
      this.name,
      this.createdAt,
      this.visible,
      this.priority,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a domain plan in status idle. */
export function newDomainPlan(code: string, title: string): DomainPlan {
  return new DomainPlan(code, title, "", "", "", 0, false, 0, 0, "idle");
}
