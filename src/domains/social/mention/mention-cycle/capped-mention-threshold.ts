import * as text from "../../../../kit/text.js";

/** Where a capped mention threshold is in its life cycle. */
export type CappedMentionThresholdStatus = "requested" | "granted" | "revoked" | "expired";

/** One capped mention threshold, with what the planners need to act on it. */
export class CappedMentionThreshold {
  code: string;
  name: string;
  margin: number;
  frequencyCap: number;
  discount: number;
  sequence: number;
  floorValue: number;
  summary: string;
  status: CappedMentionThresholdStatus;

  constructor(
    code: string,
    name: string,
    margin: number,
    frequencyCap: number,
    discount: number,
    sequence: number,
    floorValue: number,
    summary: string,
    status: CappedMentionThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.discount = discount;
    this.sequence = sequence;
    this.floorValue = floorValue;
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

  canMoveTo(next: CappedMentionThresholdStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: CappedMentionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped mention threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round(this.frequencyCap * this.margin * 100) / 100;
  }

  copy(): CappedMentionThreshold {
    return new CappedMentionThreshold(
      this.code,
      this.name,
      this.margin,
      this.frequencyCap,
      this.discount,
      this.sequence,
      this.floorValue,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped mention threshold in status requested. */
export function newCappedMentionThreshold(code: string, name: string): CappedMentionThreshold {
  return new CappedMentionThreshold(code, name, 0, 0, 0, 0, 0, "", "requested");
}
