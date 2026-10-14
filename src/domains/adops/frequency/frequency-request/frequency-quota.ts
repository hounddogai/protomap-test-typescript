import * as text from "../../../../kit/text.js";

/** Where a frequency quota is in its life cycle. */
export type FrequencyQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One frequency quota, with what the planners need to act on it. */
export class FrequencyQuota {
  code: string;
  title: string;
  openRate: number;
  channel: string;
  unit: string;
  score: number;
  audienceId: string;
  endsAt: number;
  status: FrequencyQuotaStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    channel: string,
    unit: string,
    score: number,
    audienceId: string,
    endsAt: number,
    status: FrequencyQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.channel = channel;
    this.unit = unit;
    this.score = score;
    this.audienceId = audienceId;
    this.endsAt = endsAt;
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

  canMoveTo(next: FrequencyQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: FrequencyQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.openRate - this.score) * 100) / 100;
  }

  copy(): FrequencyQuota {
    return new FrequencyQuota(
      this.code,
      this.title,
      this.openRate,
      this.channel,
      this.unit,
      this.score,
      this.audienceId,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a frequency quota in status proposed. */
export function newFrequencyQuota(code: string, title: string): FrequencyQuota {
  return new FrequencyQuota(code, title, 0, "", "", 0, "", 0, "proposed");
}
