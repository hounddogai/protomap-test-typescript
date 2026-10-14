/**
 * The adaptive funnel baseline records of growth's funnel work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive funnel baseline is in its life cycle. */
export type AdaptiveFunnelBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive funnel baseline. Its code is unique within a tenant. */
export class AdaptiveFunnelBaseline {
  code: string;
  title: string;
  revision: number;
  openRate: number;
  ceiling: number;
  budget: number;
  ownerId: string;
  impressions: number;
  status: AdaptiveFunnelBaselineStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    openRate: number,
    ceiling: number,
    budget: number,
    ownerId: string,
    impressions: number,
    status: AdaptiveFunnelBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.budget = budget;
    this.ownerId = ownerId;
    this.impressions = impressions;
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

  canMoveTo(next: AdaptiveFunnelBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveFunnelBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive funnel baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"adaptive funnel baseline"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.openRate - this.ceiling) * 100) / 100;
  }

  copy(): AdaptiveFunnelBaseline {
    return new AdaptiveFunnelBaseline(
      this.code,
      this.title,
      this.revision,
      this.openRate,
      this.ceiling,
      this.budget,
      this.ownerId,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive funnel baseline in status idle. */
export function newAdaptiveFunnelBaseline(code: string, title: string): AdaptiveFunnelBaseline {
  return new AdaptiveFunnelBaseline(code, title, 0, 0, 0, 0, "", 0, "idle");
}
