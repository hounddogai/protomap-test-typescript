import * as text from "../../../../kit/text.js";

/** Where a pending path record is in its life cycle. */
export type PendingPathRecordStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pending path record as the path team keeps it. */
export class PendingPathRecord {
  code: string;
  label: string;
  visible: boolean;
  audienceId: string;
  contactEmail: string;
  phone: string;
  batchSize: number;
  ratio: number;
  score: number;
  status: PendingPathRecordStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    audienceId: string,
    contactEmail: string,
    phone: string,
    batchSize: number,
    ratio: number,
    score: number,
    status: PendingPathRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.audienceId = audienceId;
    this.contactEmail = contactEmail;
    this.phone = phone;
    this.batchSize = batchSize;
    this.ratio = ratio;
    this.score = score;
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

  canMoveTo(next: PendingPathRecordStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingPathRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending path record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending path record"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.batchSize * this.score * 100) / 100;
  }

  copy(): PendingPathRecord {
    return new PendingPathRecord(
      this.code,
      this.label,
      this.visible,
      this.audienceId,
      this.contactEmail,
      this.phone,
      this.batchSize,
      this.ratio,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending path record in status open. */
export function newPendingPathRecord(code: string, label: string): PendingPathRecord {
  return new PendingPathRecord(code, label, false, "", "", "", 0, 0, 0, "open");
}
