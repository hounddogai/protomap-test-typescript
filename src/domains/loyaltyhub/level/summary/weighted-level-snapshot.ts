import * as text from "../../../../kit/text.js";

/** Where a weighted level snapshot is in its life cycle. */
export type WeightedLevelSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A weighted level snapshot as the level team keeps it. */
export class WeightedLevelSnapshot {
  code: string;
  label: string;
  durationMinutes: number;
  minimum: number;
  margin: number;
  audienceId: string;
  status: WeightedLevelSnapshotStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    minimum: number,
    margin: number,
    audienceId: string,
    status: WeightedLevelSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.minimum = minimum;
    this.margin = margin;
    this.audienceId = audienceId;
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

  canMoveTo(next: WeightedLevelSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedLevelSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted level snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"weighted level snapshot"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.minimum - this.margin) * 100) / 100;
  }

  copy(): WeightedLevelSnapshot {
    return new WeightedLevelSnapshot(
      this.code,
      this.label,
      this.durationMinutes,
      this.minimum,
      this.margin,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a weighted level snapshot in status draft. */
export function newWeightedLevelSnapshot(code: string, label: string): WeightedLevelSnapshot {
  return new WeightedLevelSnapshot(code, label, 0, 0, 0, "", "draft");
}
