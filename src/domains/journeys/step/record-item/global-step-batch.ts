import * as text from "../../../../kit/text.js";

/** Where a global step batch is in its life cycle. */
export type GlobalStepBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** One global step batch, with what the planners need to act on it. */
export class GlobalStepBatch {
  code: string;
  label: string;
  sendAt: number;
  archived: boolean;
  checksum: string;
  title: string;
  journeyId: string;
  windowDays: number;
  status: GlobalStepBatchStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    archived: boolean,
    checksum: string,
    title: string,
    journeyId: string,
    windowDays: number,
    status: GlobalStepBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.archived = archived;
    this.checksum = checksum;
    this.title = title;
    this.journeyId = journeyId;
    this.windowDays = windowDays;
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

  canMoveTo(next: GlobalStepBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: GlobalStepBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global step batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"global step batch"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.sendAt + this.windowDays) * 100) / 100;
  }

  copy(): GlobalStepBatch {
    return new GlobalStepBatch(
      this.code,
      this.label,
      this.sendAt,
      this.archived,
      this.checksum,
      this.title,
      this.journeyId,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global step batch in status requested. */
export function newGlobalStepBatch(code: string, label: string): GlobalStepBatch {
  return new GlobalStepBatch(code, label, 0, false, "", "", "", 0, "requested");
}
