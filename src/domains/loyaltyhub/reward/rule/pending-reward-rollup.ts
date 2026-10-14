import * as text from "../../../../kit/text.js";

/** Where a pending reward rollup is in its life cycle. */
export type PendingRewardRollupStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One pending reward rollup, with what the planners need to act on it. */
export class PendingRewardRollup {
  code: string;
  title: string;
  updatedAt: number;
  budget: number;
  revision: number;
  contactEmail: string;
  locale: string;
  approved: boolean;
  quantity: number;
  status: PendingRewardRollupStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    budget: number,
    revision: number,
    contactEmail: string,
    locale: string,
    approved: boolean,
    quantity: number,
    status: PendingRewardRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.budget = budget;
    this.revision = revision;
    this.contactEmail = contactEmail;
    this.locale = locale;
    this.approved = approved;
    this.quantity = quantity;
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

  canMoveTo(next: PendingRewardRollupStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "draining";
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingRewardRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"pending reward rollup"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.updatedAt - this.budget) * 100) / 100;
  }

  copy(): PendingRewardRollup {
    return new PendingRewardRollup(
      this.code,
      this.title,
      this.updatedAt,
      this.budget,
      this.revision,
      this.contactEmail,
      this.locale,
      this.approved,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending reward rollup in status idle. */
export function newPendingRewardRollup(code: string, title: string): PendingRewardRollup {
  return new PendingRewardRollup(code, title, 0, 0, 0, "", "", false, 0, "idle");
}
