import * as text from "../../../../kit/text.js";

/** Where a proof plan is in its life cycle. */
export type ProofPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A proof plan. Its code is unique within a tenant. */
export class ProofPlan {
  code: string;
  title: string;
  floorValue: number;
  channel: string;
  clicks: number;
  endsAt: number;
  version: number;
  status: ProofPlanStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    channel: string,
    clicks: number,
    endsAt: number,
    version: number,
    status: ProofPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.channel = channel;
    this.clicks = clicks;
    this.endsAt = endsAt;
    this.version = version;
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

  canMoveTo(next: ProofPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ProofPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"proof plan"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.endsAt + this.floorValue) * 100) / 100;
  }

  copy(): ProofPlan {
    return new ProofPlan(
      this.code,
      this.title,
      this.floorValue,
      this.channel,
      this.clicks,
      this.endsAt,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a proof plan in status draft. */
export function newProofPlan(code: string, title: string): ProofPlan {
  return new ProofPlan(code, title, 0, "", 0, 0, 0, "draft");
}
