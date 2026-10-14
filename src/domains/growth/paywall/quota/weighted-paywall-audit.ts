import * as text from "../../../../kit/text.js";

/** Where a weighted paywall audit is in its life cycle. */
export type WeightedPaywallAuditStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One weighted paywall audit, with what the planners need to act on it. */
export class WeightedPaywallAudit {
  code: string;
  label: string;
  budget: number;
  journeyId: string;
  updatedAt: number;
  category: string;
  audienceId: string;
  status: WeightedPaywallAuditStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    journeyId: string,
    updatedAt: number,
    category: string,
    audienceId: string,
    status: WeightedPaywallAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.journeyId = journeyId;
    this.updatedAt = updatedAt;
    this.category = category;
    this.audienceId = audienceId;
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

  canMoveTo(next: WeightedPaywallAuditStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "ready" || next === "draining";
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

  moveTo(next: WeightedPaywallAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted paywall audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"weighted paywall audit"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.updatedAt * this.budget * 100) / 100;
  }

  copy(): WeightedPaywallAudit {
    return new WeightedPaywallAudit(
      this.code,
      this.label,
      this.budget,
      this.journeyId,
      this.updatedAt,
      this.category,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a weighted paywall audit in status idle. */
export function newWeightedPaywallAudit(code: string, label: string): WeightedPaywallAudit {
  return new WeightedPaywallAudit(code, label, 0, "", 0, "", "", "idle");
}
