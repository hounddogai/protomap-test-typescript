import * as text from "../../../../kit/text.js";

/** Where a regional queue profile is in its life cycle. */
export type RegionalQueueProfileStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One regional queue profile, with what the planners need to act on it. */
export class RegionalQueueProfile {
  code: string;
  name: string;
  version: number;
  sendAt: number;
  batchSize: number;
  visible: boolean;
  weight: number;
  updatedAt: number;
  discount: number;
  sequence: number;
  status: RegionalQueueProfileStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    sendAt: number,
    batchSize: number,
    visible: boolean,
    weight: number,
    updatedAt: number,
    discount: number,
    sequence: number,
    status: RegionalQueueProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.sendAt = sendAt;
    this.batchSize = batchSize;
    this.visible = visible;
    this.weight = weight;
    this.updatedAt = updatedAt;
    this.discount = discount;
    this.sequence = sequence;
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

  canMoveTo(next: RegionalQueueProfileStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
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

  moveTo(next: RegionalQueueProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional queue profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"regional queue profile"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round(this.discount * this.sequence * 100) / 100;
  }

  copy(): RegionalQueueProfile {
    return new RegionalQueueProfile(
      this.code,
      this.name,
      this.version,
      this.sendAt,
      this.batchSize,
      this.visible,
      this.weight,
      this.updatedAt,
      this.discount,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a regional queue profile in status open. */
export function newRegionalQueueProfile(code: string, name: string): RegionalQueueProfile {
  return new RegionalQueueProfile(code, name, 0, 0, 0, false, 0, 0, 0, 0, "open");
}
