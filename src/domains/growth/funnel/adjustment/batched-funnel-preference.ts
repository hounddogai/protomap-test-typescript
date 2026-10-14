import * as text from "../../../../kit/text.js";

/** Where a batched funnel preference is in its life cycle. */
export type BatchedFunnelPreferenceStatus = "created" | "validated" | "published" | "retired";

/** A batched funnel preference as the funnel team keeps it. */
export class BatchedFunnelPreference {
  code: string;
  title: string;
  region: string;
  visible: boolean;
  attempts: number;
  startsAt: number;
  status: BatchedFunnelPreferenceStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    visible: boolean,
    attempts: number,
    startsAt: number,
    status: BatchedFunnelPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.visible = visible;
    this.attempts = attempts;
    this.startsAt = startsAt;
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

  canMoveTo(next: BatchedFunnelPreferenceStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedFunnelPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched funnel preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedValue(): number {
    return Math.round((this.startsAt - this.attempts) * 100) / 100;
  }

  copy(): BatchedFunnelPreference {
    return new BatchedFunnelPreference(
      this.code,
      this.title,
      this.region,
      this.visible,
      this.attempts,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a batched funnel preference in status created. */
export function newBatchedFunnelPreference(code: string, title: string): BatchedFunnelPreference {
  return new BatchedFunnelPreference(code, title, "", false, 0, 0, "created");
}
