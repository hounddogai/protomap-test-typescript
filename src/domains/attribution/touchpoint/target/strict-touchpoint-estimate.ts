import * as text from "../../../../kit/text.js";

/** Where a strict touchpoint estimate is in its life cycle. */
export type StrictTouchpointEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** One strict touchpoint estimate, with what the planners need to act on it. */
export class StrictTouchpointEstimate {
  code: string;
  label: string;
  amount: number;
  audienceId: string;
  archived: boolean;
  summary: string;
  createdAt: number;
  channel: string;
  ratio: number;
  retries: number;
  openRate: number;
  status: StrictTouchpointEstimateStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    audienceId: string,
    archived: boolean,
    summary: string,
    createdAt: number,
    channel: string,
    ratio: number,
    retries: number,
    openRate: number,
    status: StrictTouchpointEstimateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.audienceId = audienceId;
    this.archived = archived;
    this.summary = summary;
    this.createdAt = createdAt;
    this.channel = channel;
    this.ratio = ratio;
    this.retries = retries;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictTouchpointEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictTouchpointEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict touchpoint estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netValue(): number {
    return Math.round(this.createdAt * this.openRate * 100) / 100;
  }

  copy(): StrictTouchpointEstimate {
    return new StrictTouchpointEstimate(
      this.code,
      this.label,
      this.amount,
      this.audienceId,
      this.archived,
      this.summary,
      this.createdAt,
      this.channel,
      this.ratio,
      this.retries,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict touchpoint estimate in status requested. */
export function newStrictTouchpointEstimate(code: string, label: string): StrictTouchpointEstimate {
  return new StrictTouchpointEstimate(code, label, 0, "", false, "", 0, "", 0, 0, 0, "requested");
}
