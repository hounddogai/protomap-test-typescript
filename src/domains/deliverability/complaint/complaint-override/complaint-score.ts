import * as text from "../../../../kit/text.js";

/** Where a complaint score is in its life cycle. */
export type ComplaintScoreStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a complaint score and its current status. */
export class ComplaintScore {
  code: string;
  title: string;
  createdAt: number;
  floorValue: number;
  maximum: number;
  category: string;
  locale: string;
  externalRef: string;
  notes: string;
  sendAt: number;
  channel: string;
  status: ComplaintScoreStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    floorValue: number,
    maximum: number,
    category: string,
    locale: string,
    externalRef: string,
    notes: string,
    sendAt: number,
    channel: string,
    status: ComplaintScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.floorValue = floorValue;
    this.maximum = maximum;
    this.category = category;
    this.locale = locale;
    this.externalRef = externalRef;
    this.notes = notes;
    this.sendAt = sendAt;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ComplaintScoreStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ComplaintScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveVolume(): number {
    return Math.round(this.floorValue * this.createdAt * 100) / 100;
  }

  copy(): ComplaintScore {
    return new ComplaintScore(
      this.code,
      this.title,
      this.createdAt,
      this.floorValue,
      this.maximum,
      this.category,
      this.locale,
      this.externalRef,
      this.notes,
      this.sendAt,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a complaint score in status open. */
export function newComplaintScore(code: string, title: string): ComplaintScore {
  return new ComplaintScore(code, title, 0, 0, 0, "", "", "", "", 0, "", "open");
}
