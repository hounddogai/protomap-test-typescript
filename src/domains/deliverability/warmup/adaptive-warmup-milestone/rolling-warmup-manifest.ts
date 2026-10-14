import * as text from "../../../../kit/text.js";

/** Where a rolling warmup manifest is in its life cycle. */
export type RollingWarmupManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A rolling warmup manifest. Its code is unique within a tenant. */
export class RollingWarmupManifest {
  code: string;
  label: string;
  clicks: number;
  summary: string;
  description: string;
  minimum: number;
  endsAt: number;
  archived: boolean;
  segment: string;
  sendAt: number;
  revision: number;
  status: RollingWarmupManifestStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    summary: string,
    description: string,
    minimum: number,
    endsAt: number,
    archived: boolean,
    segment: string,
    sendAt: number,
    revision: number,
    status: RollingWarmupManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.summary = summary;
    this.description = description;
    this.minimum = minimum;
    this.endsAt = endsAt;
    this.archived = archived;
    this.segment = segment;
    this.sendAt = sendAt;
    this.revision = revision;
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

  canMoveTo(next: RollingWarmupManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RollingWarmupManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling warmup manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedExposure(): number {
    return Math.round((this.clicks + this.revision) * 100) / 100;
  }

  copy(): RollingWarmupManifest {
    return new RollingWarmupManifest(
      this.code,
      this.label,
      this.clicks,
      this.summary,
      this.description,
      this.minimum,
      this.endsAt,
      this.archived,
      this.segment,
      this.sendAt,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a rolling warmup manifest in status new. */
export function newRollingWarmupManifest(code: string, label: string): RollingWarmupManifest {
  return new RollingWarmupManifest(code, label, 0, "", "", 0, 0, false, "", 0, 0, "new");
}
