import * as text from "../../../../kit/text.js";

/** Where a capped csat manifest is in its life cycle. */
export type CappedCsatManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A capped csat manifest. Its code is unique within a tenant. */
export class CappedCsatManifest {
  code: string;
  label: string;
  notes: string;
  cohort: string;
  updatedAt: number;
  ceiling: number;
  summary: string;
  segment: string;
  visible: boolean;
  status: CappedCsatManifestStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    cohort: string,
    updatedAt: number,
    ceiling: number,
    summary: string,
    segment: string,
    visible: boolean,
    status: CappedCsatManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.cohort = cohort;
    this.updatedAt = updatedAt;
    this.ceiling = ceiling;
    this.summary = summary;
    this.segment = segment;
    this.visible = visible;
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

  canMoveTo(next: CappedCsatManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CappedCsatManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped csat manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round((this.updatedAt + this.ceiling) * 100) / 100;
  }

  copy(): CappedCsatManifest {
    return new CappedCsatManifest(
      this.code,
      this.label,
      this.notes,
      this.cohort,
      this.updatedAt,
      this.ceiling,
      this.summary,
      this.segment,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a capped csat manifest in status planned. */
export function newCappedCsatManifest(code: string, label: string): CappedCsatManifest {
  return new CappedCsatManifest(code, label, "", "", 0, 0, "", "", false, "planned");
}
