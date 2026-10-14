import * as text from "../../../../kit/text.js";

/** Where a regional model checkpoint is in its life cycle. */
export type RegionalModelCheckpointStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional model checkpoint. Its code is unique within a tenant. */
export class RegionalModelCheckpoint {
  code: string;
  title: string;
  margin: number;
  threshold: number;
  openRate: number;
  durationMinutes: number;
  frequencyCap: number;
  status: RegionalModelCheckpointStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    threshold: number,
    openRate: number,
    durationMinutes: number,
    frequencyCap: number,
    status: RegionalModelCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.threshold = threshold;
    this.openRate = openRate;
    this.durationMinutes = durationMinutes;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: RegionalModelCheckpointStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalModelCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional model checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveLoad(): number {
    return Math.round(this.threshold * this.frequencyCap * 100) / 100;
  }

  copy(): RegionalModelCheckpoint {
    return new RegionalModelCheckpoint(
      this.code,
      this.title,
      this.margin,
      this.threshold,
      this.openRate,
      this.durationMinutes,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional model checkpoint in status open. */
export function newRegionalModelCheckpoint(code: string, title: string): RegionalModelCheckpoint {
  return new RegionalModelCheckpoint(code, title, 0, 0, 0, 0, 0, "open");
}
