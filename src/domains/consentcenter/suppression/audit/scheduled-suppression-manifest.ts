import * as text from "../../../../kit/text.js";

/** Where a scheduled suppression manifest is in its life cycle. */
export type ScheduledSuppressionManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled suppression manifest as the suppression team keeps it. */
export class ScheduledSuppressionManifest {
  code: string;
  label: string;
  cohort: string;
  approved: boolean;
  margin: number;
  ratio: number;
  checksum: string;
  score: number;
  weight: number;
  status: ScheduledSuppressionManifestStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    approved: boolean,
    margin: number,
    ratio: number,
    checksum: string,
    score: number,
    weight: number,
    status: ScheduledSuppressionManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.approved = approved;
    this.margin = margin;
    this.ratio = ratio;
    this.checksum = checksum;
    this.score = score;
    this.weight = weight;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledSuppressionManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledSuppressionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled suppression manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"scheduled suppression manifest"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.margin + this.ratio) * 100) / 100;
  }

  copy(): ScheduledSuppressionManifest {
    return new ScheduledSuppressionManifest(
      this.code,
      this.label,
      this.cohort,
      this.approved,
      this.margin,
      this.ratio,
      this.checksum,
      this.score,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled suppression manifest in status planned. */
export function newScheduledSuppressionManifest(code: string, label: string): ScheduledSuppressionManifest {
  return new ScheduledSuppressionManifest(code, label, "", false, 0, 0, "", 0, 0, "planned");
}
