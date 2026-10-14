import * as text from "../../../../kit/text.js";

/** Where a double opt in override is in its life cycle. */
export type DoubleOptInOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A double opt in override. Its code is unique within a tenant. */
export class DoubleOptInOverride {
  code: string;
  name: string;
  batchSize: number;
  maximum: number;
  region: string;
  audienceId: string;
  startsAt: number;
  status: DoubleOptInOverrideStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    maximum: number,
    region: string,
    audienceId: string,
    startsAt: number,
    status: DoubleOptInOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.maximum = maximum;
    this.region = region;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DoubleOptInOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DoubleOptInOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`double opt in override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"double opt in override"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.maximum * this.startsAt * 100) / 100;
  }

  copy(): DoubleOptInOverride {
    return new DoubleOptInOverride(
      this.code,
      this.name,
      this.batchSize,
      this.maximum,
      this.region,
      this.audienceId,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a double opt in override in status idle. */
export function newDoubleOptInOverride(code: string, name: string): DoubleOptInOverride {
  return new DoubleOptInOverride(code, name, 0, 0, "", "", 0, "idle");
}
