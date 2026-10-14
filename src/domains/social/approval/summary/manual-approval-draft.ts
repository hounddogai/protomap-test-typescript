import * as text from "../../../../kit/text.js";

/** Where a manual approval draft is in its life cycle. */
export type ManualApprovalDraftStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual approval draft. Its code is unique within a tenant. */
export class ManualApprovalDraft {
  code: string;
  label: string;
  channel: string;
  category: string;
  impressions: number;
  campaignRef: string;
  ratio: number;
  approved: boolean;
  summary: string;
  segment: string;
  locale: string;
  status: ManualApprovalDraftStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    category: string,
    impressions: number,
    campaignRef: string,
    ratio: number,
    approved: boolean,
    summary: string,
    segment: string,
    locale: string,
    status: ManualApprovalDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.category = category;
    this.impressions = impressions;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.approved = approved;
    this.summary = summary;
    this.segment = segment;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualApprovalDraftStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualApprovalDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual approval draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual approval draft"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.impressions * this.ratio * 100) / 100;
  }

  copy(): ManualApprovalDraft {
    return new ManualApprovalDraft(
      this.code,
      this.label,
      this.channel,
      this.category,
      this.impressions,
      this.campaignRef,
      this.ratio,
      this.approved,
      this.summary,
      this.segment,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual approval draft in status idle. */
export function newManualApprovalDraft(code: string, label: string): ManualApprovalDraft {
  return new ManualApprovalDraft(code, label, "", "", 0, "", 0, false, "", "", "", "idle");
}
