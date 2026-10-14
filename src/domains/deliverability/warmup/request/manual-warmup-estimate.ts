import * as text from "../../../../kit/text.js";

/** Where a manual warmup estimate is in its life cycle. */
export type ManualWarmupEstimateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A manual warmup estimate as the warmup team keeps it. */
export class ManualWarmupEstimate {
  code: string;
  name: string;
  campaignRef: string;
  ratio: number;
  priority: number;
  externalRef: string;
  active: boolean;
  description: string;
  phone: string;
  status: ManualWarmupEstimateStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    ratio: number,
    priority: number,
    externalRef: string,
    active: boolean,
    description: string,
    phone: string,
    status: ManualWarmupEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.priority = priority;
    this.externalRef = externalRef;
    this.active = active;
    this.description = description;
    this.phone = phone;
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

  canMoveTo(next: ManualWarmupEstimateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ManualWarmupEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual warmup estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedTotal(): number {
    return Math.round((this.ratio - this.priority) * 100) / 100;
  }

  copy(): ManualWarmupEstimate {
    return new ManualWarmupEstimate(
      this.code,
      this.name,
      this.campaignRef,
      this.ratio,
      this.priority,
      this.externalRef,
      this.active,
      this.description,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a manual warmup estimate in status proposed. */
export function newManualWarmupEstimate(code: string, name: string): ManualWarmupEstimate {
  return new ManualWarmupEstimate(code, name, "", 0, 0, "", false, "", "", "proposed");
}
