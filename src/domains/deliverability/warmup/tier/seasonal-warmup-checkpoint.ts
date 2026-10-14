import * as text from "../../../../kit/text.js";

/** Where a seasonal warmup checkpoint is in its life cycle. */
export type SeasonalWarmupCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal warmup checkpoint, with what the planners need to act on it. */
export class SeasonalWarmupCheckpoint {
  code: string;
  title: string;
  retries: number;
  batchSize: number;
  contactEmail: string;
  sequence: number;
  locale: string;
  reviewer: string;
  country: string;
  visible: boolean;
  frequencyCap: number;
  status: SeasonalWarmupCheckpointStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    batchSize: number,
    contactEmail: string,
    sequence: number,
    locale: string,
    reviewer: string,
    country: string,
    visible: boolean,
    frequencyCap: number,
    status: SeasonalWarmupCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.batchSize = batchSize;
    this.contactEmail = contactEmail;
    this.sequence = sequence;
    this.locale = locale;
    this.reviewer = reviewer;
    this.country = country;
    this.visible = visible;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: SeasonalWarmupCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalWarmupCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal warmup checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round(this.frequencyCap * this.batchSize * 100) / 100;
  }

  copy(): SeasonalWarmupCheckpoint {
    return new SeasonalWarmupCheckpoint(
      this.code,
      this.title,
      this.retries,
      this.batchSize,
      this.contactEmail,
      this.sequence,
      this.locale,
      this.reviewer,
      this.country,
      this.visible,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal warmup checkpoint in status draft. */
export function newSeasonalWarmupCheckpoint(code: string, title: string): SeasonalWarmupCheckpoint {
  return new SeasonalWarmupCheckpoint(code, title, 0, 0, "", 0, "", "", "", false, 0, "draft");
}
