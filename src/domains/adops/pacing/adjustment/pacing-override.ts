import * as text from "../../../../kit/text.js";

/** Where a pacing override is in its life cycle. */
export type PacingOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pacing override as the pacing team keeps it. */
export class PacingOverride {
  code: string;
  title: string;
  timezone: string;
  cost: number;
  visible: boolean;
  utmSource: string;
  weight: number;
  endsAt: number;
  category: string;
  status: PacingOverrideStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    cost: number,
    visible: boolean,
    utmSource: string,
    weight: number,
    endsAt: number,
    category: string,
    status: PacingOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.cost = cost;
    this.visible = visible;
    this.utmSource = utmSource;
    this.weight = weight;
    this.endsAt = endsAt;
    this.category = category;
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

  canMoveTo(next: PacingOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pacing override"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.endsAt - this.cost) * 100) / 100;
  }

  copy(): PacingOverride {
    return new PacingOverride(
      this.code,
      this.title,
      this.timezone,
      this.cost,
      this.visible,
      this.utmSource,
      this.weight,
      this.endsAt,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pacing override in status new. */
export function newPacingOverride(code: string, title: string): PacingOverride {
  return new PacingOverride(code, title, "", 0, false, "", 0, 0, "", "new");
}
