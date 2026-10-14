import * as text from "../../../../kit/text.js";

/** Where a seasonal deflection manifest is in its life cycle. */
export type SeasonalDeflectionManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A seasonal deflection manifest. Its code is unique within a tenant. */
export class SeasonalDeflectionManifest {
  code: string;
  title: string;
  endsAt: number;
  ownerId: string;
  graceDays: number;
  openRate: number;
  status: SeasonalDeflectionManifestStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    ownerId: string,
    graceDays: number,
    openRate: number,
    status: SeasonalDeflectionManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.graceDays = graceDays;
    this.openRate = openRate;
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

  canMoveTo(next: SeasonalDeflectionManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalDeflectionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal deflection manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"seasonal deflection manifest"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.endsAt - this.graceDays) * 100) / 100;
  }

  copy(): SeasonalDeflectionManifest {
    return new SeasonalDeflectionManifest(
      this.code,
      this.title,
      this.endsAt,
      this.ownerId,
      this.graceDays,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal deflection manifest in status idle. */
export function newSeasonalDeflectionManifest(code: string, title: string): SeasonalDeflectionManifest {
  return new SeasonalDeflectionManifest(code, title, 0, "", 0, 0, "idle");
}
