import * as text from "../../../../kit/text.js";

/** Where a rolling subscription bundle is in its life cycle. */
export type RollingSubscriptionBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling subscription bundle, with what the planners need to act on it. */
export class RollingSubscriptionBundle {
  code: string;
  name: string;
  reviewer: string;
  active: boolean;
  archived: boolean;
  conversionRate: number;
  status: RollingSubscriptionBundleStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    active: boolean,
    archived: boolean,
    conversionRate: number,
    status: RollingSubscriptionBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.active = active;
    this.archived = archived;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: RollingSubscriptionBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingSubscriptionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling subscription bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling subscription bundle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): RollingSubscriptionBundle {
    return new RollingSubscriptionBundle(
      this.code,
      this.name,
      this.reviewer,
      this.active,
      this.archived,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a rolling subscription bundle in status planned. */
export function newRollingSubscriptionBundle(code: string, name: string): RollingSubscriptionBundle {
  return new RollingSubscriptionBundle(code, name, "", false, false, 0, "planned");
}
