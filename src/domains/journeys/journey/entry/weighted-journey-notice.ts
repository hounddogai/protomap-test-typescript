import * as text from "../../../../kit/text.js";

/** Where a weighted journey notice is in its life cycle. */
export type WeightedJourneyNoticeStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted journey notice. Its code is unique within a tenant. */
export class WeightedJourneyNotice {
  code: string;
  label: string;
  rate: number;
  name: string;
  source: string;
  pinned: boolean;
  status: WeightedJourneyNoticeStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    name: string,
    source: string,
    pinned: boolean,
    status: WeightedJourneyNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.name = name;
    this.source = source;
    this.pinned = pinned;
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

  canMoveTo(next: WeightedJourneyNoticeStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedJourneyNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted journey notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted journey notice"} ${this.code}`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): WeightedJourneyNotice {
    return new WeightedJourneyNotice(
      this.code,
      this.label,
      this.rate,
      this.name,
      this.source,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted journey notice in status proposed. */
export function newWeightedJourneyNotice(code: string, label: string): WeightedJourneyNotice {
  return new WeightedJourneyNotice(code, label, 0, "", "", false, "proposed");
}
