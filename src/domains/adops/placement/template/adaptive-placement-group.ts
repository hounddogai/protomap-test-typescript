import * as text from "../../../../kit/text.js";

/** Where a adaptive placement group is in its life cycle. */
export type AdaptivePlacementGroupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One adaptive placement group, with what the planners need to act on it. */
export class AdaptivePlacementGroup {
  code: string;
  label: string;
  openRate: number;
  revision: number;
  windowDays: number;
  threshold: number;
  rate: number;
  utmSource: string;
  status: AdaptivePlacementGroupStatus;

  constructor(
    code: string,
    label: string,
    openRate: number,
    revision: number,
    windowDays: number,
    threshold: number,
    rate: number,
    utmSource: string,
    status: AdaptivePlacementGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.openRate = openRate;
    this.revision = revision;
    this.windowDays = windowDays;
    this.threshold = threshold;
    this.rate = rate;
    this.utmSource = utmSource;
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

  canMoveTo(next: AdaptivePlacementGroupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptivePlacementGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive placement group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round((this.revision - this.rate) * 100) / 100;
  }

  copy(): AdaptivePlacementGroup {
    return new AdaptivePlacementGroup(
      this.code,
      this.label,
      this.openRate,
      this.revision,
      this.windowDays,
      this.threshold,
      this.rate,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive placement group in status planned. */
export function newAdaptivePlacementGroup(code: string, label: string): AdaptivePlacementGroup {
  return new AdaptivePlacementGroup(code, label, 0, 0, 0, 0, 0, "", "planned");
}
