import * as text from "../../../../kit/text.js";

/** Where a manual ticket view estimate is in its life cycle. */
export type ManualTicketViewEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One manual ticket view estimate, with what the planners need to act on it. */
export class ManualTicketViewEstimate {
  code: string;
  title: string;
  batchSize: number;
  approved: boolean;
  ratio: number;
  durationMinutes: number;
  expiresAt: number;
  timezone: string;
  audienceId: string;
  region: string;
  status: ManualTicketViewEstimateStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    approved: boolean,
    ratio: number,
    durationMinutes: number,
    expiresAt: number,
    timezone: string,
    audienceId: string,
    region: string,
    status: ManualTicketViewEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.approved = approved;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.expiresAt = expiresAt;
    this.timezone = timezone;
    this.audienceId = audienceId;
    this.region = region;
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

  canMoveTo(next: ManualTicketViewEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualTicketViewEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual ticket view estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"manual ticket view estimate"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.durationMinutes + this.expiresAt) * 100) / 100;
  }

  copy(): ManualTicketViewEstimate {
    return new ManualTicketViewEstimate(
      this.code,
      this.title,
      this.batchSize,
      this.approved,
      this.ratio,
      this.durationMinutes,
      this.expiresAt,
      this.timezone,
      this.audienceId,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a manual ticket view estimate in status draft. */
export function newManualTicketViewEstimate(code: string, title: string): ManualTicketViewEstimate {
  return new ManualTicketViewEstimate(code, title, 0, false, 0, 0, 0, "", "", "", "draft");
}
