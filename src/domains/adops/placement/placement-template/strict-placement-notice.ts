import * as text from "../../../../kit/text.js";

/** Where a strict placement notice is in its life cycle. */
export type StrictPlacementNoticeStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a strict placement notice and its current status. */
export class StrictPlacementNotice {
  code: string;
  label: string;
  externalRef: string;
  journeyId: string;
  openRate: number;
  title: string;
  summary: string;
  conversionRate: number;
  visible: boolean;
  limit: number;
  status: StrictPlacementNoticeStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    journeyId: string,
    openRate: number,
    title: string,
    summary: string,
    conversionRate: number,
    visible: boolean,
    limit: number,
    status: StrictPlacementNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.openRate = openRate;
    this.title = title;
    this.summary = summary;
    this.conversionRate = conversionRate;
    this.visible = visible;
    this.limit = limit;
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

  canMoveTo(next: StrictPlacementNoticeStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
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
        switch (next) {
          case "suspended":
          case "closed":
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

  moveTo(next: StrictPlacementNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict placement notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveVolume(): number {
    return Math.round((this.conversionRate + this.limit) * 100) / 100;
  }

  copy(): StrictPlacementNotice {
    return new StrictPlacementNotice(
      this.code,
      this.label,
      this.externalRef,
      this.journeyId,
      this.openRate,
      this.title,
      this.summary,
      this.conversionRate,
      this.visible,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict placement notice in status draft. */
export function newStrictPlacementNotice(code: string, label: string): StrictPlacementNotice {
  return new StrictPlacementNotice(code, label, "", "", 0, "", "", 0, false, 0, "draft");
}
