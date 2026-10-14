import * as text from "../../../../kit/text.js";

/** Where a placement checkpoint is in its life cycle. */
export type PlacementCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A placement checkpoint as the placement team keeps it. */
export class PlacementCheckpoint {
  code: string;
  label: string;
  attempts: number;
  country: string;
  amount: number;
  revision: number;
  visible: boolean;
  clicks: number;
  category: string;
  frequencyCap: number;
  status: PlacementCheckpointStatus;

  constructor(
    code: string,
    label: string,
    attempts: number,
    country: string,
    amount: number,
    revision: number,
    visible: boolean,
    clicks: number,
    category: string,
    frequencyCap: number,
    status: PlacementCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.country = country;
    this.amount = amount;
    this.revision = revision;
    this.visible = visible;
    this.clicks = clicks;
    this.category = category;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: PlacementCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"placement checkpoint"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.frequencyCap - this.amount) * 100) / 100;
  }

  copy(): PlacementCheckpoint {
    return new PlacementCheckpoint(
      this.code,
      this.label,
      this.attempts,
      this.country,
      this.amount,
      this.revision,
      this.visible,
      this.clicks,
      this.category,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a placement checkpoint in status created. */
export function newPlacementCheckpoint(code: string, label: string): PlacementCheckpoint {
  return new PlacementCheckpoint(code, label, 0, "", 0, 0, false, 0, "", 0, "created");
}
