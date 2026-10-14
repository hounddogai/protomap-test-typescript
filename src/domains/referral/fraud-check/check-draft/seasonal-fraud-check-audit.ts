import * as text from "../../../../kit/text.js";

/** Where a seasonal fraud check audit is in its life cycle. */
export type SeasonalFraudCheckAuditStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal fraud check audit. Its code is unique within a tenant. */
export class SeasonalFraudCheckAudit {
  code: string;
  title: string;
  checksum: string;
  amount: number;
  audienceId: string;
  startsAt: number;
  segment: string;
  version: number;
  status: SeasonalFraudCheckAuditStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    amount: number,
    audienceId: string,
    startsAt: number,
    segment: string,
    version: number,
    status: SeasonalFraudCheckAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.amount = amount;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.segment = segment;
    this.version = version;
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

  canMoveTo(next: SeasonalFraudCheckAuditStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalFraudCheckAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal fraud check audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"seasonal fraud check audit"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.startsAt - this.version) * 100) / 100;
  }

  copy(): SeasonalFraudCheckAudit {
    return new SeasonalFraudCheckAudit(
      this.code,
      this.title,
      this.checksum,
      this.amount,
      this.audienceId,
      this.startsAt,
      this.segment,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal fraud check audit in status planned. */
export function newSeasonalFraudCheckAudit(code: string, title: string): SeasonalFraudCheckAudit {
  return new SeasonalFraudCheckAudit(code, title, "", 0, "", 0, "", 0, "planned");
}
