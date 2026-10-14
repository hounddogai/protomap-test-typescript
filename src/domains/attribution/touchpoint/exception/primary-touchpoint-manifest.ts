import * as text from "../../../../kit/text.js";

/** Where a primary touchpoint manifest is in its life cycle. */
export type PrimaryTouchpointManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A primary touchpoint manifest as the touchpoint team keeps it. */
export class PrimaryTouchpointManifest {
  code: string;
  label: string;
  archived: boolean;
  category: string;
  ownerId: string;
  openRate: number;
  description: string;
  status: PrimaryTouchpointManifestStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    category: string,
    ownerId: string,
    openRate: number,
    description: string,
    status: PrimaryTouchpointManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.category = category;
    this.ownerId = ownerId;
    this.openRate = openRate;
    this.description = description;
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

  canMoveTo(next: PrimaryTouchpointManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryTouchpointManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary touchpoint manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary touchpoint manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): PrimaryTouchpointManifest {
    return new PrimaryTouchpointManifest(
      this.code,
      this.label,
      this.archived,
      this.category,
      this.ownerId,
      this.openRate,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary touchpoint manifest in status new. */
export function newPrimaryTouchpointManifest(code: string, label: string): PrimaryTouchpointManifest {
  return new PrimaryTouchpointManifest(code, label, false, "", "", 0, "", "new");
}
