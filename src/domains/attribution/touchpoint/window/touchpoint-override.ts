import * as text from "../../../../kit/text.js";

/** Where a touchpoint override is in its life cycle. */
export type TouchpointOverrideStatus = "created" | "validated" | "published" | "retired";

/** A touchpoint override as the touchpoint team keeps it. */
export class TouchpointOverride {
  code: string;
  label: string;
  updatedAt: number;
  endsAt: number;
  audienceId: string;
  budget: number;
  threshold: number;
  approved: boolean;
  campaignRef: string;
  status: TouchpointOverrideStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    endsAt: number,
    audienceId: string,
    budget: number,
    threshold: number,
    approved: boolean,
    campaignRef: string,
    status: TouchpointOverrideStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.endsAt = endsAt;
    this.audienceId = audienceId;
    this.budget = budget;
    this.threshold = threshold;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TouchpointOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TouchpointOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.endsAt - this.threshold) * 100) / 100;
  }

  copy(): TouchpointOverride {
    return new TouchpointOverride(
      this.code,
      this.label,
      this.updatedAt,
      this.endsAt,
      this.audienceId,
      this.budget,
      this.threshold,
      this.approved,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a touchpoint override in status created. */
export function newTouchpointOverride(code: string, label: string): TouchpointOverride {
  return new TouchpointOverride(code, label, 0, 0, "", 0, 0, false, "", "created");
}
