import * as text from "../../../../kit/text.js";

/** Where a conversion profile is in its life cycle. */
export type ConversionProfileStatus = "new" | "queued" | "running" | "done" | "failed";

/** A conversion profile. Its code is unique within a tenant. */
export class ConversionProfile {
  code: string;
  label: string;
  ownerId: string;
  threshold: number;
  visible: boolean;
  score: number;
  impressions: number;
  amount: number;
  status: ConversionProfileStatus;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    threshold: number,
    visible: boolean,
    score: number,
    impressions: number,
    amount: number,
    status: ConversionProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.threshold = threshold;
    this.visible = visible;
    this.score = score;
    this.impressions = impressions;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionProfileStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"conversion profile"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.impressions * this.threshold * 100) / 100;
  }

  copy(): ConversionProfile {
    return new ConversionProfile(
      this.code,
      this.label,
      this.ownerId,
      this.threshold,
      this.visible,
      this.score,
      this.impressions,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a conversion profile in status new. */
export function newConversionProfile(code: string, label: string): ConversionProfile {
  return new ConversionProfile(code, label, "", 0, false, 0, 0, 0, "new");
}
