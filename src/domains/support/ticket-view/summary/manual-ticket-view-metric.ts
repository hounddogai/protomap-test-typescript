import * as text from "../../../../kit/text.js";

/** Where a manual ticket view metric is in its life cycle. */
export type ManualTicketViewMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a manual ticket view metric and its current status. */
export class ManualTicketViewMetric {
  code: string;
  title: string;
  impressions: number;
  audienceId: string;
  archived: boolean;
  channel: string;
  minimum: number;
  pinned: boolean;
  margin: number;
  summary: string;
  status: ManualTicketViewMetricStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    audienceId: string,
    archived: boolean,
    channel: string,
    minimum: number,
    pinned: boolean,
    margin: number,
    summary: string,
    status: ManualTicketViewMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.archived = archived;
    this.channel = channel;
    this.minimum = minimum;
    this.pinned = pinned;
    this.margin = margin;
    this.summary = summary;
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

  canMoveTo(next: ManualTicketViewMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualTicketViewMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual ticket view metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round((this.minimum - this.margin) * 100) / 100;
  }

  copy(): ManualTicketViewMetric {
    return new ManualTicketViewMetric(
      this.code,
      this.title,
      this.impressions,
      this.audienceId,
      this.archived,
      this.channel,
      this.minimum,
      this.pinned,
      this.margin,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual ticket view metric in status requested. */
export function newManualTicketViewMetric(code: string, title: string): ManualTicketViewMetric {
  return new ManualTicketViewMetric(code, title, 0, "", false, "", 0, false, 0, "", "requested");
}
