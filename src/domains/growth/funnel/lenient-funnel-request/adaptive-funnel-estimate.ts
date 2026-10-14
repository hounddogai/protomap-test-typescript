import * as text from "../../../../kit/text.js";

/** Where a adaptive funnel estimate is in its life cycle. */
export type AdaptiveFunnelEstimateStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a adaptive funnel estimate and its current status. */
export class AdaptiveFunnelEstimate {
  code: string;
  title: string;
  visible: boolean;
  approved: boolean;
  endsAt: number;
  floorValue: number;
  campaignRef: string;
  attributes: Map<string, string>;
  name: string;
  priority: number;
  status: AdaptiveFunnelEstimateStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    approved: boolean,
    endsAt: number,
    floorValue: number,
    campaignRef: string,
    attributes: Map<string, string>,
    name: string,
    priority: number,
    status: AdaptiveFunnelEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.approved = approved;
    this.endsAt = endsAt;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
    this.attributes = attributes;
    this.name = name;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveFunnelEstimateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveFunnelEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive funnel estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedLoad(): number {
    return Math.round((this.priority - this.endsAt) * 100) / 100;
  }

  copy(): AdaptiveFunnelEstimate {
    return new AdaptiveFunnelEstimate(
      this.code,
      this.title,
      this.visible,
      this.approved,
      this.endsAt,
      this.floorValue,
      this.campaignRef,
      this.attributes,
      this.name,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive funnel estimate in status new. */
export function newAdaptiveFunnelEstimate(code: string, title: string): AdaptiveFunnelEstimate {
  return new AdaptiveFunnelEstimate(code, title, false, false, 0, 0, "", new Map<string, string>(), "", 0, "new");
}
