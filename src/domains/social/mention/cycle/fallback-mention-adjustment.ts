import * as text from "../../../../kit/text.js";

/** Where a fallback mention adjustment is in its life cycle. */
export type FallbackMentionAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a fallback mention adjustment and its current status. */
export class FallbackMentionAdjustment {
  code: string;
  label: string;
  phone: string;
  revision: number;
  campaignRef: string;
  status: FallbackMentionAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    revision: number,
    campaignRef: string,
    status: FallbackMentionAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.revision = revision;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: FallbackMentionAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackMentionAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback mention adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): FallbackMentionAdjustment {
    return new FallbackMentionAdjustment(
      this.code,
      this.label,
      this.phone,
      this.revision,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback mention adjustment in status created. */
export function newFallbackMentionAdjustment(code: string, label: string): FallbackMentionAdjustment {
  return new FallbackMentionAdjustment(code, label, "", 0, "", "created");
}
