import * as text from "../../../../kit/text.js";

/** Where a scheduled streak manifest is in its life cycle. */
export type ScheduledStreakManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One scheduled streak manifest, with what the planners need to act on it. */
export class ScheduledStreakManifest {
  code: string;
  label: string;
  summary: string;
  budget: number;
  audienceId: string;
  status: ScheduledStreakManifestStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    budget: number,
    audienceId: string,
    status: ScheduledStreakManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.budget = budget;
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

  canMoveTo(next: ScheduledStreakManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: ScheduledStreakManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled streak manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): ScheduledStreakManifest {
    return new ScheduledStreakManifest(this.code, this.label, this.summary, this.budget, this.audienceId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled streak manifest in status draft. */
export function newScheduledStreakManifest(code: string, label: string): ScheduledStreakManifest {
  return new ScheduledStreakManifest(code, label, "", 0, "", "draft");
}
