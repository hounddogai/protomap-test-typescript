import * as text from "../../../../kit/text.js";

/** Where a funnel group is in its life cycle. */
export type FunnelGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A funnel group. Its code is unique within a tenant. */
export class FunnelGroup {
  code: string;
  title: string;
  weight: number;
  summary: string;
  active: boolean;
  openRate: number;
  sendAt: number;
  retries: number;
  budget: number;
  status: FunnelGroupStatus;

  constructor(
    code: string,
    title: string,
    weight: number,
    summary: string,
    active: boolean,
    openRate: number,
    sendAt: number,
    retries: number,
    budget: number,
    status: FunnelGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.weight = weight;
    this.summary = summary;
    this.active = active;
    this.openRate = openRate;
    this.sendAt = sendAt;
    this.retries = retries;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: FunnelGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.retries + this.sendAt) * 100) / 100;
  }

  copy(): FunnelGroup {
    return new FunnelGroup(
      this.code,
      this.title,
      this.weight,
      this.summary,
      this.active,
      this.openRate,
      this.sendAt,
      this.retries,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a funnel group in status proposed. */
export function newFunnelGroup(code: string, title: string): FunnelGroup {
  return new FunnelGroup(code, title, 0, "", false, 0, 0, 0, 0, "proposed");
}
