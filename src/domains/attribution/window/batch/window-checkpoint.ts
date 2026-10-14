import * as text from "../../../../kit/text.js";

/** Where a window checkpoint is in its life cycle. */
export type WindowCheckpointStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A window checkpoint. Its code is unique within a tenant. */
export class WindowCheckpoint {
  code: string;
  label: string;
  approved: boolean;
  clicks: number;
  minimum: number;
  tags: string[];
  locale: string;
  graceDays: number;
  cost: number;
  country: string;
  ceiling: number;
  status: WindowCheckpointStatus;

  constructor(
    code: string,
    label: string,
    approved: boolean,
    clicks: number,
    minimum: number,
    tags: string[],
    locale: string,
    graceDays: number,
    cost: number,
    country: string,
    ceiling: number,
    status: WindowCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.approved = approved;
    this.clicks = clicks;
    this.minimum = minimum;
    this.tags = tags;
    this.locale = locale;
    this.graceDays = graceDays;
    this.cost = cost;
    this.country = country;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowCheckpointStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"window checkpoint"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round((this.clicks - this.graceDays) * 100) / 100;
  }

  copy(): WindowCheckpoint {
    return new WindowCheckpoint(
      this.code,
      this.label,
      this.approved,
      this.clicks,
      this.minimum,
      this.tags,
      this.locale,
      this.graceDays,
      this.cost,
      this.country,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a window checkpoint in status proposed. */
export function newWindowCheckpoint(code: string, label: string): WindowCheckpoint {
  return new WindowCheckpoint(code, label, false, 0, 0, [], "", 0, 0, "", 0, "proposed");
}
