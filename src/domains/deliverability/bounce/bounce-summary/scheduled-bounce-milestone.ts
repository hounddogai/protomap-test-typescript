import * as text from "../../../../kit/text.js";

/** Where a scheduled bounce milestone is in its life cycle. */
export type ScheduledBounceMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled bounce milestone as the bounce team keeps it. */
export class ScheduledBounceMilestone {
  code: string;
  label: string;
  version: number;
  name: string;
  locale: string;
  threshold: number;
  status: ScheduledBounceMilestoneStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    name: string,
    locale: string,
    threshold: number,
    status: ScheduledBounceMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.name = name;
    this.locale = locale;
    this.threshold = threshold;
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

  canMoveTo(next: ScheduledBounceMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
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

  moveTo(next: ScheduledBounceMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled bounce milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"scheduled bounce milestone"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.threshold * this.version * 100) / 100;
  }

  copy(): ScheduledBounceMilestone {
    return new ScheduledBounceMilestone(
      this.code,
      this.label,
      this.version,
      this.name,
      this.locale,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled bounce milestone in status open. */
export function newScheduledBounceMilestone(code: string, label: string): ScheduledBounceMilestone {
  return new ScheduledBounceMilestone(code, label, 0, "", "", 0, "open");
}
