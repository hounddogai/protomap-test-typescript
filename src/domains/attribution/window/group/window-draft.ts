import * as text from "../../../../kit/text.js";

/** Where a window draft is in its life cycle. */
export type WindowDraftStatus = "created" | "validated" | "published" | "retired";

/** A window draft as the window team keeps it. */
export class WindowDraft {
  code: string;
  title: string;
  utmSource: string;
  sendAt: number;
  campaignRef: string;
  region: string;
  segment: string;
  archived: boolean;
  cost: number;
  conversionRate: number;
  status: WindowDraftStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    sendAt: number,
    campaignRef: string,
    region: string,
    segment: string,
    archived: boolean,
    cost: number,
    conversionRate: number,
    status: WindowDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.sendAt = sendAt;
    this.campaignRef = campaignRef;
    this.region = region;
    this.segment = segment;
    this.archived = archived;
    this.cost = cost;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowDraftStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WindowDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"window draft"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round(this.conversionRate * this.cost * 100) / 100;
  }

  copy(): WindowDraft {
    return new WindowDraft(
      this.code,
      this.title,
      this.utmSource,
      this.sendAt,
      this.campaignRef,
      this.region,
      this.segment,
      this.archived,
      this.cost,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a window draft in status created. */
export function newWindowDraft(code: string, title: string): WindowDraft {
  return new WindowDraft(code, title, "", 0, "", "", "", false, 0, 0, "created");
}
