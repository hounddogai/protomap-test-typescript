import * as text from "../../../../kit/text.js";

/** Where a scheduled funnel manifest is in its life cycle. */
export type ScheduledFunnelManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a scheduled funnel manifest and its current status. */
export class ScheduledFunnelManifest {
  code: string;
  name: string;
  approved: boolean;
  minimum: number;
  visible: boolean;
  score: number;
  status: ScheduledFunnelManifestStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    minimum: number,
    visible: boolean,
    score: number,
    status: ScheduledFunnelManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.minimum = minimum;
    this.visible = visible;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledFunnelManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ScheduledFunnelManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled funnel manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.score + this.minimum) * 100) / 100;
  }

  copy(): ScheduledFunnelManifest {
    return new ScheduledFunnelManifest(
      this.code,
      this.name,
      this.approved,
      this.minimum,
      this.visible,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a scheduled funnel manifest in status new. */
export function newScheduledFunnelManifest(code: string, name: string): ScheduledFunnelManifest {
  return new ScheduledFunnelManifest(code, name, false, 0, false, 0, "new");
}
