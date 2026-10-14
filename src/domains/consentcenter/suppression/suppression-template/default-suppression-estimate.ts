import * as text from "../../../../kit/text.js";

/** Where a default suppression estimate is in its life cycle. */
export type DefaultSuppressionEstimateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One default suppression estimate, with what the planners need to act on it. */
export class DefaultSuppressionEstimate {
  code: string;
  title: string;
  durationMinutes: number;
  visible: boolean;
  expiresAt: number;
  ownerId: string;
  impressions: number;
  timezone: string;
  status: DefaultSuppressionEstimateStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    visible: boolean,
    expiresAt: number,
    ownerId: string,
    impressions: number,
    timezone: string,
    status: DefaultSuppressionEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.visible = visible;
    this.expiresAt = expiresAt;
    this.ownerId = ownerId;
    this.impressions = impressions;
    this.timezone = timezone;
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

  canMoveTo(next: DefaultSuppressionEstimateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultSuppressionEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default suppression estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round(this.expiresAt * this.impressions * 100) / 100;
  }

  copy(): DefaultSuppressionEstimate {
    return new DefaultSuppressionEstimate(
      this.code,
      this.title,
      this.durationMinutes,
      this.visible,
      this.expiresAt,
      this.ownerId,
      this.impressions,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default suppression estimate in status draft. */
export function newDefaultSuppressionEstimate(code: string, title: string): DefaultSuppressionEstimate {
  return new DefaultSuppressionEstimate(code, title, 0, false, 0, "", 0, "", "draft");
}
