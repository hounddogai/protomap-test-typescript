import * as text from "../../../../kit/text.js";

/** Where a lenient approval forecast is in its life cycle. */
export type LenientApprovalForecastStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A lenient approval forecast. Its code is unique within a tenant. */
export class LenientApprovalForecast {
  code: string;
  name: string;
  priority: number;
  impressions: number;
  journeyId: string;
  floorValue: number;
  sendAt: number;
  version: number;
  status: LenientApprovalForecastStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    impressions: number,
    journeyId: string,
    floorValue: number,
    sendAt: number,
    version: number,
    status: LenientApprovalForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.impressions = impressions;
    this.journeyId = journeyId;
    this.floorValue = floorValue;
    this.sendAt = sendAt;
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

  canMoveTo(next: LenientApprovalForecastStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientApprovalForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient approval forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"lenient approval forecast"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.impressions + this.version) * 100) / 100;
  }

  copy(): LenientApprovalForecast {
    return new LenientApprovalForecast(
      this.code,
      this.name,
      this.priority,
      this.impressions,
      this.journeyId,
      this.floorValue,
      this.sendAt,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient approval forecast in status draft. */
export function newLenientApprovalForecast(code: string, name: string): LenientApprovalForecast {
  return new LenientApprovalForecast(code, name, 0, 0, "", 0, 0, 0, "draft");
}
