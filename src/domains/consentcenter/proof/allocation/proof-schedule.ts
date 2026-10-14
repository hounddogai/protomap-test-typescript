import * as text from "../../../../kit/text.js";

/** Where a proof schedule is in its life cycle. */
export type ProofScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One proof schedule, with what the planners need to act on it. */
export class ProofSchedule {
  code: string;
  title: string;
  expiresAt: number;
  label: string;
  locale: string;
  cohort: string;
  batchSize: number;
  visible: boolean;
  graceDays: number;
  campaignRef: string;
  archived: boolean;
  status: ProofScheduleStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    label: string,
    locale: string,
    cohort: string,
    batchSize: number,
    visible: boolean,
    graceDays: number,
    campaignRef: string,
    archived: boolean,
    status: ProofScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.label = label;
    this.locale = locale;
    this.cohort = cohort;
    this.batchSize = batchSize;
    this.visible = visible;
    this.graceDays = graceDays;
    this.campaignRef = campaignRef;
    this.archived = archived;
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

  canMoveTo(next: ProofScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.graceDays - this.batchSize) * 100) / 100;
  }

  copy(): ProofSchedule {
    return new ProofSchedule(
      this.code,
      this.title,
      this.expiresAt,
      this.label,
      this.locale,
      this.cohort,
      this.batchSize,
      this.visible,
      this.graceDays,
      this.campaignRef,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a proof schedule in status draft. */
export function newProofSchedule(code: string, title: string): ProofSchedule {
  return new ProofSchedule(code, title, 0, "", "", "", 0, false, 0, "", false, "draft");
}
