import * as text from "../../../../kit/text.js";

/** Where a batched placement draft is in its life cycle. */
export type BatchedPlacementDraftStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched placement draft as the placement team keeps it. */
export class BatchedPlacementDraft {
  code: string;
  label: string;
  quantity: number;
  graceDays: number;
  sendAt: number;
  archived: boolean;
  journeyId: string;
  channel: string;
  variant: string;
  status: BatchedPlacementDraftStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    graceDays: number,
    sendAt: number,
    archived: boolean,
    journeyId: string,
    channel: string,
    variant: string,
    status: BatchedPlacementDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.graceDays = graceDays;
    this.sendAt = sendAt;
    this.archived = archived;
    this.journeyId = journeyId;
    this.channel = channel;
    this.variant = variant;
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

  canMoveTo(next: BatchedPlacementDraftStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "failed":
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

  moveTo(next: BatchedPlacementDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched placement draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round((this.sendAt - this.quantity) * 100) / 100;
  }

  copy(): BatchedPlacementDraft {
    return new BatchedPlacementDraft(
      this.code,
      this.label,
      this.quantity,
      this.graceDays,
      this.sendAt,
      this.archived,
      this.journeyId,
      this.channel,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched placement draft in status new. */
export function newBatchedPlacementDraft(code: string, label: string): BatchedPlacementDraft {
  return new BatchedPlacementDraft(code, label, 0, 0, 0, false, "", "", "", "new");
}
